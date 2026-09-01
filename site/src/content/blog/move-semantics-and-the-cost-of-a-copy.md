---
title: 'Move semantics, and why copies are expensive'
description: 'A pointer copied twice will free the same memory twice. Following that bug to its fix explains deep copies, r-value references, and what moving an object really is.'
category: cpp
publishDate: 2026-09-01
tags: ['c++', 'memory', 'performance', 'fundamentals']
heroGlyph: activity
---

Here is a class small enough to fit in your head and broken in a way that takes a while to see.

```cpp
class Shallow {
private:
    int *data;
public:
    Shallow(int d);
    ~Shallow();
};

Shallow::Shallow(int d) {
    data = new int;    // grab some heap
    *data = d;
}

Shallow::~Shallow() {
    delete data;       // give it back
}
```

Constructor allocates, destructor frees. That is the deal, and it holds right up until someone copies the object.

## The default copy is a member-wise copy

Write no copy constructor and C++ writes one for you. It copies each member across, one at a time. `data` is a member, so `data` gets copied.

`data` is a pointer. Copying a pointer copies the address, not the thing at the address.

```text
  before                          after  Shallow b {a};

  a.data ──▶ [ 42 ]               a.data ──┐
                                           ├──▶ [ 42 ]
                                  b.data ──┘
```

Two objects. One buffer. Both destructors will run, and both will call `delete` on the same address. The first free is fine. The second is undefined behaviour, which in practice means a crash somewhere unrelated, minutes later, in code that did nothing wrong.

Worse: while both are alive, writing through `a` changes what `b` sees. They are not two accounts. They are one account with two names.

## The fix is to copy what is pointed at

A deep copy allocates its own buffer and copies the value into it:

```cpp
Shallow::Shallow(const Shallow &source) {
    data = new int;            // my own storage
    *data = *source.data;      // my own copy of the value
}
```

```text
  a.data ──▶ [ 42 ]
  b.data ──▶ [ 42 ]      two buffers, two owners, two clean frees
```

The rule this produces: if your class holds a raw pointer to something it owns, you owe it a copy constructor that deep copies. The compiler's default is correct for `int` and `std::string` and wrong for anything you allocated yourself.

And now the class is correct and slow.

## The copy you did not ask for

C++ copies a lot, and most of it is invisible. Return an object from a function, pass one by value, push one into a vector that needs to grow, and you have paid for a deep copy. Do that inside a loop over a large buffer and the copies dominate the profile.

Some of those copies are unavoidable. Many are not, because the source was about to be destroyed anyway.

```cpp
total = combine(a, b);
```

`combine` builds a result, copies it out, and the original is thrown away. You allocated a buffer, copied every byte into a second buffer, then freed the first. The second buffer is byte for byte what the first one was.

Nobody would write that by hand. The language wrote it for you, because the only tool it had was "copy".

## L-values, r-values, and the second ampersand

To avoid that copy, the language needs to know something it previously could not express: *is this thing about to disappear?*

That is the distinction between l-values and r-values. An l-value has a name and a place you can point at. An r-value is a temporary, the unnamed thing an expression produces before it is used.

```cpp
int x {100};

int &lref = x;      // l-value reference, binds to something named
int &&rref = 200;   // r-value reference, binds to a temporary

// int &&bad = x;   // error: x has a name, it is not going anywhere
```

`&&` is not "reference to a reference". It is a separate thing, and it means "this binds only to a temporary".

That distinction lets you overload on it:

```cpp
void func(int &num);    // A: takes something with a name
void func(int &&num);   // B: takes a temporary

func(x);     // calls A
func(200);   // calls B
```

Which is how the compiler picks between copying and moving without you writing a single `if`.

## Moving is stealing

A move constructor takes an r-value reference, so it only ever runs on an object that is about to die. That permission changes everything, because it no longer has to leave the source intact.

```cpp
Shallow::Shallow(Shallow &&source) noexcept
    : data{source.data}        // take the pointer, not the buffer
{
    source.data = nullptr;     // and make sure they cannot free it
}
```

```text
  before move                     after move

  src.data ──▶ [ 42 ]             src.data ──▶ nullptr
                                  dst.data ──▶ [ 42 ]
```

No allocation. No byte copying. Two pointer assignments, and the buffer has a new owner. Whether it held four bytes or four megabytes, the move costs the same.

Two details in that signature earn their place. There is no `const`, because the whole point is modifying the source. And `noexcept` matters more than it looks: `std::vector` will only move your elements while reallocating if the move cannot throw. Leave it off and the vector quietly deep copies instead, which is the exact cost you wrote the move constructor to avoid.

## The compiler was already ahead of you

Before you conclude that every copy in your codebase is a bug, know that the compiler elides many of them outright. Return value optimization builds the returned object directly in the caller's storage, so neither a copy nor a move happens. C++17 made this mandatory in common cases.

This is worth knowing mainly so you are not surprised in a debugger, watching a copy constructor you carefully wrote never get called.

## What this explains elsewhere

Once you have seen a double free caused by a copied pointer, other languages read differently.

A Go slice is a small struct holding a pointer, a length, and a capacity. Assigning it copies those three fields, not the backing array. That is a shallow copy, exactly the one above. Go does not crash, because the garbage collector will not free an array that something still points at, but the aliasing is real, and it is the reason `append` sometimes mutates a slice you thought you had copied and sometimes does not.

JavaScript objects behave the same way. `const b = a` gives you two names for one object, and this is why the ecosystem keeps reinventing structured cloning.

Neither language will hand you a double free. Both will hand you two names for one buffer, and the debugging session that follows is the same one.
