---
title: 'RAII and deterministic destruction versus a garbage collector'
description: 'C++ has no finally block and does not need one. Destructors run at a known point, in a known order, and that guarantee is what replaces defer and try-with-resources.'
category: cpp
publishDate: 2026-08-25
tags: ['c++', 'memory', 'resource-management', 'fundamentals']
heroGlyph: shield
---

C++ has no `finally`. It has no `defer`, no `with`, no `using`, no try-with-resources. Every other language I work in has grown some version of that construct, and the one with manual memory management never needed it.

The reason is a single guarantee about destructors.

## The guarantee

A destructor is the method named after the class with a tilde in front. One per class, no arguments, no return type, and you never call it:

```cpp
class Player {
private:
    std::string name;
public:
    Player(std::string n);
    ~Player();
};
```

It runs automatically when the object is destroyed. For an object with a name, declared inside a block, that moment is when control leaves the block. Not eventually. Not at the next collection. At the closing brace.

```cpp
{
    Player slayer;
    Player josh {"Josh", 100, 4};
    Player hero {"Hero"};
    // ... use them
}   // three destructors have now run
```

Three objects on the stack, three destructors, all before the next line executes. The compiler emits those calls. You cannot forget them, and there is no path out of that block that skips them.

That last part is the interesting one.

## It holds on the paths you did not write

Early return, break, an exception thrown four frames down: all of them leave the block, so all of them run the destructors. An exception propagating through unwinds each scope on the way out and destroys every local object it passes.

Which means this is complete:

```cpp
void process() {
    std::ofstream log {"run.log"};   // opened here
    risky();                         // may throw
}                                    // closed here, thrown or not
```

There is no second code path to write. Compare the shape you would write in a language without the guarantee:

```java
FileWriter log = null;
try {
    log = new FileWriter("run.log");
    risky();
} finally {
    if (log != null) log.close();
}
```

The C++ version is not shorter because C++ is terser. It is shorter because the cleanup moved into the type. Anyone who uses `ofstream` gets the correct behaviour without knowing it needed handling, and cannot get it wrong by writing the call site badly. That is the pattern people mean by RAII: acquire the resource in the constructor, release it in the destructor, and let scope do the rest.

The name is about memory but the idea is not. File handles, sockets, mutex locks, database transactions, anything with a matching pair of operations.

## Construction and destruction are mirror images

The order is fixed and worth knowing, because it is what makes composed objects safe.

Within a scope, objects are destroyed in reverse order of construction. Under inheritance, the base is constructed first and destroyed last:

```text
  Derived d;

  construction              destruction
  ───────────────▶          ◀───────────────
  Base()                    ~Derived()
  Derived()                 ~Base()
```

The base part has to exist before the derived constructor runs, because the derived class may use it. On the way out, the derived part has to be dismantled before the base it was built on disappears. Reverse order is not a convention, it is the only order that is safe.

The same logic covers members. A class holding a connection and a buffer built from it destroys them in an order where the dependency still exists while it is needed.

## What you give up

This guarantee only applies to objects the compiler knows the lifetime of, which means objects with a name and a scope. Reach for `new` and you leave that world:

```cpp
Player *enemy = new Player {"Enemy", 1000, 0};
delete enemy;    // destructor runs here, because you said so
```

Now the destructor runs when you call `delete`, and the compiler will not remind you. Forget it and the destructor never runs at all. Between the `new` and the `delete`, any early return leaks.

That is the trade the whole language argument is about. The compiler gives you exact, predictable cleanup, and charges you for being wrong about ownership.

Modern C++ mostly buys its way out with `unique_ptr` and `shared_ptr`, which are objects with destructors that own a heap allocation. The scope guarantee comes back, applied to something on the heap. RAII solving the problem RAII created.

## Against a garbage collector

Go and Java give you the opposite trade. Memory is never your problem, and in exchange you lose the timing.

A garbage collector answers "is anything still referencing this?" and it answers it whenever it feels like it. That is exactly right for memory, where the only question is whether the bytes can be reused. It is wrong for a file handle, a socket, or a lock, because those have a limit that is nothing to do with memory pressure. You can exhaust a connection pool while the heap is nearly empty, and the collector has no reason to act.

So the construct comes back, out in the open:

```go
f, err := os.Open("run.log")
if err != nil { return err }
defer f.Close()
```

`defer` is the same guarantee, scoped to the function rather than the block, and opted into per call site. It is a good design. It is also visible in a way RAII is not: every caller has to remember it, and forgetting is silent.

Java's finalizers tried to be destructors and are deprecated for the reason above. They run at collection time, which is to say at no time you can plan around.

Neither model is the better one. Deterministic destruction costs you the ownership question on every allocation. Garbage collection costs you the timing on every non-memory resource. Knowing which cost you are paying is what tells you where the bug is going to be, and after six years the resource leaks I have chased were never in the C++.
