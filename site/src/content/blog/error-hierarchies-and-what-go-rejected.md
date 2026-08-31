---
title: 'Exception hierarchies, and what Go rejected'
description: 'A constructor cannot return an error code, so C++ throws. The std::exception tree, what catching a base class buys you, and where errors.As lands.'
category: cpp
publishDate: 2026-07-21
tags: ['c++', 'exceptions', 'error-handling', 'fundamentals']
heroGlyph: search
---

```cpp
Account::Account(std::string name, double balance)
    : name{name}, balance{balance} {
    if (balance < 0.0)
        throw IllegalBalanceException{};
}
```

A constructor has no return value. It cannot hand back `false`, it cannot hand back an error code, and there is no half-built object it would be safe to give you instead. When the arguments are wrong, or the file it was told to open is not there, or the memory it needed did not arrive, there is exactly one way out.

That is the strongest argument for exceptions I know, and it is not really about style. Some functions have no channel to report failure through.

## Where a class can throw, and where it must not

Methods throw the way plain functions do. Nothing new there.

Constructors are the interesting case. If you cannot establish the invariant the class promises, throw, and the object never comes into existence:

```cpp
try {
    auto moes = std::make_unique<CheckingAccount>("Moe", -10.0);
    // use moes
}
catch (const IllegalBalanceException &ex) {
    std::cerr << "Couldn't create account\n";
}
```

The program continues. There is no partially valid `Account` sitting in a variable waiting for someone to forget to check it.

Destructors are the opposite rule, and it is absolute. Do not throw from one. Since C++11 they are `noexcept` by default anyway, so the compiler already assumes you won't. The reason is the unwinding machinery: when an exception isn't caught in the current scope, C++ walks back up the call stack looking for a handler, and every scope it leaves on the way runs the destructors for the objects in it. A destructor that throws at that moment is throwing a second exception while the first is still in flight. The original handler is never reached. The program terminates instead, and you debug a crash whose actual cause was three frames and one type away.

## Throw objects, catch references

Throw an object, not a primitive. `throw 0;` compiles fine and a `catch (int &ex)` somewhere up the stack will handle it, but now the integer zero is your error protocol and any other function that throws an int is competing for the same handler. A named type is unambiguous:

```cpp
class DivideByZeroException { };
class NegativeValueException { };

double calculateMpg(int miles, int gallons) {
    if (gallons == 0)
        throw DivideByZeroException();
    if (miles < 0 || gallons < 0)
        throw NegativeValueException();
    return static_cast<double>(miles) / gallons;
}
```

Throw by value, catch by reference. Catching by value copies the thrown object into the handler's parameter, and if the handler's type is a base class, the copy is only the base part. The derived half is sliced off, and a virtual call that should have reached your override reaches the base implementation instead. Catch by `const` reference and you get the actual object.

## The tree

The standard library ships a hierarchy, rooted at `std::exception`. Every class in it implements one virtual function:

```cpp
virtual const char *what() const noexcept;
```

It returns a C-style string describing what happened. That is the entire interface.

```text
  std::exception
  │
  ├── logic_error          a bug in your code
  │   ├── invalid_argument
  │   ├── domain_error
  │   ├── length_error
  │   └── out_of_range
  │
  ├── runtime_error        a condition from the world
  │   ├── range_error
  │   ├── overflow_error
  │   ├── underflow_error
  │   └── system_error
  │
  └── bad_alloc            the allocator gave up
```

That split down the middle is the part that travels. A `logic_error` means a precondition was violated by the caller: you indexed past the end, you passed an argument the function documented as illegal. It was checkable before the call and somebody didn't check. A `runtime_error` means the world said no. The number didn't fit, the syscall failed, the resource wasn't there.

The two need completely different handling. One is a defect and the correct response is usually to fail loudly, because retrying a bug just runs the bug again. The other is a condition, and retrying, backing off, or degrading is exactly right. Almost every error taxonomy I have seen since is trying to draw this same line, usually badly.

`bad_alloc` hangs off the root rather than either branch, which is honest. Running out of memory is not your logic and not really the world's either.

## Deriving into it

Nothing stops you from adding to the tree. Derive publicly from `std::exception` and your class is one, so it can be caught anywhere a `std::exception` is expected:

```cpp
class IllegalBalanceException : public std::exception {
public:
    IllegalBalanceException() noexcept = default;
    ~IllegalBalanceException() = default;

    const char *what() const noexcept override {
        return "Illegal balance exception";
    }
};
```

Dynamic dispatch does the rest at runtime. Real error codes, offending values, and context all go in as members, set by the constructor, and `what()` reports them. Keep `noexcept` on it and mean it: throwing from a function marked `noexcept` doesn't propagate, it terminates.

And now catching by category works:

```cpp
try {
    reconcile(batch);
}
catch (const std::out_of_range &ex) {  // the one I want to report
    report_bad_index(ex.what());
}
catch (const std::logic_error &ex) {   // anything else that is my fault
    abort_batch(ex.what());
}
catch (const std::runtime_error &ex) { // the world's problem, try again
    requeue(batch, ex.what());
}
```

Handlers are tested in source order and the first type that matches wins, so the ordering is load-bearing. Swap the first two and the specific handler is dead code, because `out_of_range` is a `logic_error` and the broader one gets there first. There is also `catch (...)`, which catches everything and gives you no object at all, so you learn that something failed and nothing else.

Written down like that, it looks like a clean win. One handler covers a branch of the tree, new exception types slot in without touching call sites, and the categories mean something.

## What it costs, which is real

I have maintained the TypeScript version of this idea: a base `AppError`, a dozen subclasses, `instanceof` checks at the boundary. Same design, same two problems.

Look again at `calculateMpg`. Its signature is `double calculateMpg(int, int)`. Nothing in that tells you it can throw, or what. To find out, you read the body, and then you read the bodies of everything it calls, and then you read the bodies of those. The information exists and it is nowhere near where you need it.

C++ did try to fix this. You could once list the types a function might throw in its signature, and it was removed in C++17, because the check happened at runtime rather than at compile time. A violation didn't fail your build. It called `std::unexpected` in production. What survives is `noexcept`, which carries one bit: throws, or doesn't.

The deeper cost is that every call becomes a potential exit. `reconcile(batch);` looks like a statement that runs and returns. It is also a jump to a handler somewhere up the stack that you cannot see from here, possibly skipping the rest of this function, and the only clue is the try block wrapped around it. Control flow that doesn't appear at the call site is control flow you will forget exists, and the place you forget is the place the resource leaks.

Java took the other road and made the compiler enforce it: `throws IOException` is part of the method contract, and callers must handle it or declare it themselves. It works exactly as advertised, and what people do with it is wrap everything in an unchecked exception to make the compiler stop talking.

## Where Go landed

Go looked at all of this and refused the mechanism entirely. Errors are ordinary values, returned like any other value:

```go
cfg, err := loadConfig(path)
if err != nil {
    return fmt.Errorf("starting worker: %w", err)
}
```

The `%w` verb wraps rather than formats, so the returned error carries the original inside it. Do that at each layer and you build a chain. Then you interrogate the chain:

```go
if errors.Is(err, fs.ErrNotExist) {
    // matched a sentinel value anywhere in the chain
}

var pathErr *fs.PathError
if errors.As(err, &pathErr) {
    // matched a type, and pathErr now points at it
    log.Printf("bad path: %s", pathErr.Path)
}
```

`errors.As` walks the chain, finds the first error whose concrete type is assignable to your target, and assigns it. Which is catch-by-base-class, arrived at from the opposite direction. C++ starts with a type hierarchy and searches the call stack for a handler that matches. Go starts with values and searches a wrapped chain for a type that matches. Both are a type-directed search for the first thing that fits.

The difference is not expressiveness. It is where the search happens. In Go it is a function call on a line you wrote, in the function you are reading, and if you delete it nothing invisible takes over. In C++ it is the language, and it runs whether or not anyone is looking.

I'll be honest about the part that doesn't favour Go: `(Config, error)` doesn't tell you what can fail either. It is one bit. C++ hands you a genuinely richer description of the failure and hides it; Go hands you almost nothing and puts it directly in your face on every line. Neither signature answers the question you actually have.

But one visible bit beats a taxonomy you have to go looking for. The errors that have cost me real time were never the ones whose type I knew. They were the ones I didn't know could happen at all.
