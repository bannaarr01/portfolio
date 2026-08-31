---
title: 'What virtual actually changes'
description: "A base-class pointer holding a derived object runs the base method. Why C++ binds at compile time, what virtual costs per object, and how Go's itab differs."
category: cpp
publishDate: 2026-07-28
tags: ['c++', 'polymorphism', 'interfaces', 'fundamentals']
heroGlyph: arrow-up-right
---

Two lines that do not do what they look like they do:

```cpp
Account *p = new Trust();
p->withdraw(1000);        // Account::withdraw
```

`Trust` inherits from `Account` and defines its own `withdraw`. The object sitting on the heap is a `Trust`. The call runs the `Account` version.

The first time I hit this I assumed I had broken the inheritance somewhere. I had not. That is C++ behaving exactly as specified, and the specification is the reverse of what every other language I write had trained me to expect.

## The compiler binds to the type of the pointer

Deciding which function a call refers to is called binding, and C++ does it at compile time by default: the compiler reads the declared type of the expression you called through and picks that type's method.

`p` is declared `Account *`. That is the whole input to the decision. The compiler does not know, and will not go looking, that the `new Trust()` one line above put a `Trust` at that address. The pointer says `Account`, so the call is wired to `Account::withdraw` before the program ever runs.

On objects with names this is invisible: declared type and actual type are the same thing.

```cpp
Savings b;
b.withdraw(1000);    // Savings::withdraw, as expected
```

Redefining a base method in a derived class works fine, and you can still reach the original on purpose:

```cpp
class Savings : public Account {
    void deposit(double amount) {
        amount += interest;
        Account::deposit(amount);   // the base version, deliberately
    }
};
```

That is a real technique, and it is also the ceiling of what static binding gives you. Hold a mixed collection of accounts, want each one to behave like the thing it is, and you are stuck:

```cpp
void displayAccount(const Account &acc) {
    acc.display();     // Account::display. Always.
}
```

Four account types can be passed to that function. One implementation runs.

## virtual defers the decision

Mark the base method `virtual` and every one of those call sites changes behaviour without being edited:

```cpp
class Account {
public:
    virtual void withdraw(double amount);
    virtual void display() const;
    virtual ~Account();
};
```

`virtual` is an instruction to the compiler to stop resolving the call. Emit a lookup instead, and let the running program ask the object what it is.

Three conditions have to hold together: inheritance, a virtual method, and a call made through a base-class pointer or reference. Call on a plain object and you get static binding again, correctly, because a `Savings` variable can only ever contain a `Savings`.

The reference case matters more than it looks. It gives you dynamic dispatch with nothing on the heap:

```cpp
Trust t;
displayAccount(t);   // Trust::display
```

`displayAccount` was not touched. Only `display` was.

Virtual is sticky. Once a method is virtual in a base class it is virtual in every class beneath it, whether or not the derived declaration repeats the keyword.

## Getting the signature wrong is silent

An override has to match the base declaration exactly: name, parameters, const qualification, return type. Miss any part and you have not overridden anything, you have redefined, and redefinition is bound statically.

```cpp
class Base {
public:
    virtual void sayHello() const { /* ... */ }
};

class Derived : public Base {
public:
    virtual void sayHello() { /* ... */ }   // no const. Not an override.
};
```

That compiles clean. It runs. Through a `Base *` it calls `Base::sayHello` forever, and the word `virtual` sitting right there in the derived class makes it look correct. I lost an afternoon to the missing-const version.

C++11 turned the silence into a compiler error:

```cpp
virtual void sayHello() override;   // error: does not override
```

`override` costs nothing at runtime and catches the entire family of typo. Put it on every override you write.

And any class with a virtual function needs a public virtual destructor. Delete a derived object through a base pointer without one and the derived destructor never runs, which the standard calls undefined behaviour.

## Where the cost lives

The standard describes the behaviour, not the machinery. Every implementation I have looked at builds the same machinery anyway: a table.

A class with virtual functions gets one table of function pointers, laid out at compile time and shared by every object of that class. Each object gets one hidden pointer to its class's table, written in during construction.

```text
                            Trust vtable, one per class
    p ──▶ ┌──────────┐      ┌────────────────────────┐
          │ vptr ────┼─────▶│ [0]  Trust::withdraw   │
          ├──────────┤      │ [1]  Trust::display    │
          │ balance  │      │ [2]  Trust::~Trust     │
          │ name     │      └────────────────────────┘
          └──────────┘
```

A virtual call becomes: read the vptr out of the object, index a fixed slot, call through whatever pointer is in it. The slot number is decided at compile time, so nothing is searched. `withdraw` is slot 0 in `Account`'s table and slot 0 in every table derived from it, which is why the call site never needs to know which class it landed in.

That buys two costs. Every object of a polymorphic class carries a pointer it did not ask for: eight bytes on a 64-bit target, the same eight whether the class declares one virtual function or forty.

The bigger cost never shows up in `sizeof`. The compiler cannot inline through the table, because it does not know the target, so the call blocks every optimisation that inlining would have unlocked downstream. Once per request, this is nothing. In a tight loop over a million elements, it is why somebody starts talking about templates.

Which is the argument for making it opt-in. You pay for dispatch at the point where you asked for it.

## A class doing an interface's job

C++ has no `interface` keyword. It has enough parts lying around that you can build one.

A pure virtual function is a virtual function declared with `= 0` and usually no body:

```cpp
class Shape {
public:
    virtual void draw() = 0;
    virtual void rotate() = 0;
    virtual ~Shape() {}
};
```

One pure virtual function makes the class abstract, and an abstract class cannot be instantiated. `Shape s;` will not compile. Neither will `new Shape()`. You reach a `Shape` only through a pointer or reference to a concrete class derived from it, and a class becomes concrete only by overriding every pure virtual function it inherited.

Now take a class that is nothing but public pure virtual functions. It names a set of services and implements none of them, and any class that wants to provide them says so by inheriting and implementing all of them. Every method, exactly matching. That is an interface, assembled from parts that were not designed for the job.

The example that made it land for me was a printable interface:

```cpp
class Printable {
    friend std::ostream &operator<<(std::ostream &os, const Printable &obj);
public:
    virtual void print(std::ostream &os) const = 0;
    virtual ~Printable() {}
};

std::ostream &operator<<(std::ostream &os, const Printable &obj) {
    obj.print(os);
    return os;
}
```

One `operator<<`, written once, taking a reference to something abstract. `obj.print(os)` is a virtual call through a base reference, so it runs the concrete class's `print`. Anything that inherits `Printable` and implements `print` becomes streamable, and the streaming code never learns its name.

You will see these named `I_Shape` or `IShape` out in the wild, a convention that exists because the compiler has nothing to say about intent here. It sees an abstract class. Only the name tells you it was meant as a contract.

## Go was told nothing

Go's interfaces satisfy structurally. `*os.File` has a `Write` method with the right signature, so `*os.File` is an `io.Writer`. Neither type was ever told about the other, and the check happens at the assignment, on the shape of the method set. C++ cannot do that: `Circle` has to name `Shape` in its own declaration, which means you can never make a type you do not own satisfy an interface you just wrote.

Go still dispatches through a table. An interface value is two words wide:

```text
    var w io.Writer = f

    w ──▶ ┌──────────────┐
          │ itab ────────┼──▶ methods of *File, as io.Writer
          │ data ────────┼──▶ the *File itself
          └──────────────┘
```

The itab is that table. It holds the concrete type's descriptor plus pointers to exactly the methods this interface requires, and it is keyed by the pair of types rather than by the concrete type alone. `*os.File` used as an `io.Writer` and `*os.File` used as an `io.ReadWriteCloser` produce two different itabs. The compiler and linker build the ones that are statically obvious; the runtime builds and caches the rest on first use.

So the itab is not the type's method table, and it is not carried by the value. That second part is the real difference. The pointer lives in the interface value, which means an `*os.File` you never assign to an interface has no itab near it and pays nothing. C++ puts the vptr inside the object, so every instance of a polymorphic class pays whether or not one call is ever dispatched dynamically. Go moved the cost to the boundary where dispatch happens.

Java went the other way entirely: instance methods are virtual by default and you opt out with `final`, the C++ default read backwards, with a JIT that claws back most of the cost by devirtualizing call sites it can prove see only one type.

All three end up calling through a table of function pointers. What differs is who holds the pointer to that table, and when somebody filled it in. C++ is the one that makes you say out loud which methods were worth it.
