---
title: 'Pointer, reference, or value, and how to choose'
description: 'C++ makes every function state whether the callee gets a copy, another name for your object, or an address that might be null. Go asks the same thing, quietly.'
category: cpp
publishDate: 2026-08-04
tags: ['c++', 'pointers', 'references', 'fundamentals']
heroGlyph: code
---

Four spellings of the same function, and nothing compiles until you pick one:

```cpp
void process(Report r);          // a copy, yours to wreck
void process(Report &r);         // the caller's report, under another name
void process(const Report &r);   // the same, read-only
void process(Report *r);         // its address, or nothing at all
```

Most languages settle this by category and then never mention it again. Primitives copy, objects don't, and the call site looks identical either way. C++ puts the answer in the signature of every function you write, and the answer is load-bearing: it decides what the call costs, whether the caller's data can change under them, and whether "no report" is a thing you are able to say.

## What a copy actually costs

Pass by value and the parameter is a fresh object built from the argument. For an `int` that is four bytes into a register. There is no cheaper thing a function can do, and no reason to complicate it. If the parameter is an `int`, a `char`, a `double`, a `bool`, take it by value and stop thinking about it.

The trap is that `sizeof` does not tell you what a copy costs. On my machine `sizeof(std::string)` is 24 bytes, and `sizeof(std::vector<std::string>)` is also 24. Those 24 bytes are a pointer, a length, and a capacity. Copying the object runs its copy constructor, which allocates a fresh buffer and copies every element in, and for a vector of strings that is one allocation for the vector and another for each string it holds. A parameter that measures 24 bytes can cost you a dozen trips to the heap. Those go by reference.

## Arrays were never given the choice

There is one type C++ refuses to copy for you, and it teaches the rest of the model. This compiles, and it does what the name says:

```cpp
void zeroArray(int numbers[], size_t size) {
    for (size_t i {0}; i < size; i++)
        numbers[i] = 0;
}

int main() {
    int myNumbers[] {1, 2, 3, 4, 5};
    zeroArray(myNumbers, 5);      // myNumbers is now all zeros
}
```

No `&` in that signature. No `*` either. The function still reached into `main` and overwrote data it does not own, because an array argument decays to a pointer to its first element, and what arrives is an address. It is also why the size has to be handed over separately: the length did not survive the decay, and `sizeof` inside the function measures a pointer.

If you did not want that, say so:

```cpp
void printArray(const int numbers[], size_t size);
```

Now any write through `numbers` is a compile error. Same address, less authority. Handing over the address and withholding permission to write is exactly what a `const &` parameter is, arrived at from the other direction.

## One name or two

A reference is an alias. It has to be bound to something that already exists at the moment you declare it, and from then on it is a second name for that storage.

```cpp
int num {100};
int &ref {num};

num = 200;      // ref is 200
ref = 300;      // num is 300
```

```text
  int num {100};
  int *ptr {&num};
  int &ref {num};

  ptr:  [ 0x61ff1c ] ──┐             a pointer is an object,
                       │             its value is an address,
                       ▼             and it can be reassigned
                    [ 100 ]
                    ▲     ▲          num and ref are two names
                num ┘     └ ref      for one piece of storage
```

Everything else about references falls out of that picture. One cannot be null, because there was an object there when you bound it. One cannot be left uninitialised. And one cannot be pointed somewhere else afterwards, because assignment writes through to the object it names. That is precisely what you want from an alias and precisely what makes it useless as a cursor. A reference behaves like a const pointer that dereferences itself.

The property that catches people is subtler:

```cpp
int square(int &n) { return n * n; }

square(num);    // fine
square(5);      // error: 5 has no storage to alias
```

Add `const` and it compiles, because the compiler may materialise a temporary and bind a const reference to it. So dropping `const` from a reference parameter also declares that callers may not pass an expression result. Correct for an out-parameter. Baffling the first time it fires on `f(a + b)`.

## A pointer is a variable whose value is an address

Which sounds like a definition and is actually the whole feature list. It can be reassigned, it can be null, and it can be uninitialised and full of garbage that happens to read as a plausible address.

```cpp
double highTemp {100.7};
double lowTemp {37.2};

double *tempPtr {&highTemp};
tempPtr = &lowTemp;        // now names something else
tempPtr = nullptr;         // now names nothing
```

A reference answers "which object" once, at birth. A pointer keeps that answer in a variable you are free to change. That freedom is also how an uninitialised pointer sits in a codebase for a year before somebody dereferences it on a Friday afternoon.

## Picking one

Take it by value when the type is small and cheap to copy and the function has no business touching the original. Simple types, mostly, and you will know them by name.

Take it by `const &` when the copy is expensive and the function only reads. This is the default for `std::string`, `std::vector`, and any class of yours with an allocation inside it. The function gets an address, the compiler enforces the read-only half, and callers can still pass a temporary.

Take it by `&` when the function is meant to modify the caller's object and there is always an object to modify. `swap(int &a, int &b)` has no better spelling.

Reach for a pointer when absence is a legitimate answer. This is the case people try to be clever about and lose, because references cannot express it at all. Half the data structures worth writing depend on a pointer going null: end of list, empty subtree, no parent. If your parameter might mean "no node", it has to be a pointer. When you want absence without mutation, `const T *const` gives you something that may be null, may not be repointed, and may not write through. C++17's `std::optional` covers optional values you own outright; a pointer remains how you say "maybe a handle to something someone else owns".

## Go asks the same question with different punctuation

Go has pointers and it has values, and nothing in between. There are no references in the C++ sense, which means there is no way to declare a parameter that aliases the caller's variable and is guaranteed not to be nil. So every time you want the callee to see your object rather than a photograph of it, you pass a pointer, and you have taken on nil as a possible value whether the domain wanted one or not.

That absence is why receivers are the thing Go developers get wrong first:

```go
func (c Counter) IncValue() { c.n++ }   // increments a copy, discards it
func (c *Counter) IncPtr()  { c.n++ }   // increments the caller's Counter
```

`IncValue` compiles, runs, mutates nothing, and reports no error anywhere. It is `void scale(Report r)` with different punctuation, and the fix is the same one: the callee needs the caller's storage, not a snapshot of it.

The cost side matches too. A value receiver copies the whole struct on every call, so a method set hanging off a struct with a few slices and a `time.Time` in it is copying that struct on each invocation to no purpose. Go then adds a wrinkle C++ does not have: the method set of `T` holds only the value-receiver methods while `*T` holds both, so mixing receivers on one type gives you interface satisfaction that depends on whether the thing in your hand is a value or a pointer. The usual advice, pick one receiver kind per type and stick to it, is really advice to make this decision once for the type instead of thirty times for its methods.

JavaScript deserves precision here, because "objects are passed by reference" is the phrase everyone uses and it is wrong. JavaScript passes everything by value. For an object, the value being passed is a reference. Reassign the parameter inside the function and the caller sees nothing; mutate the object it refers to and the caller sees everything. That is `Report *r`, minus the null check and minus any way to ask for the other three.

Every language decides this at every function boundary. Most decide for you, once, by category, and leave you to discover at runtime which one you got.
