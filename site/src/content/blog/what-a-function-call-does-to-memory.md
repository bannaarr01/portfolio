---
title: 'What a function call does to memory'
description: 'A frame gets pushed, a frame gets popped, and the ceiling was fixed when the thread was created. Which is why goroutines are cheap and Node has a maximum call stack.'
category: cpp
publishDate: 2026-08-11
tags: ['c++', 'memory', 'call-stack', 'fundamentals']
heroGlyph: server
---

```text
RangeError: Maximum call stack size exceeded
```

Node throws that. Go prints `fatal error: stack overflow` and takes the process with it. C++ usually just segfaults and tells you nothing. Three languages, three levels of politeness, one cause, and for years the best I could do was "I recursed too far".

Which is true and explains nothing. Why is there a maximum at all? Why does the heap never fail this way? Why can I run a hundred thousand goroutines on a machine that would fall over at a hundred thousand threads?

Same question, three times. C++ is where I had to answer it.

## The stack is a stack

The data structure, not a metaphor for one. A stack of books: last one on is the first one off.

The call stack holds one entry per call currently in progress. Each entry is a stack frame, or an activation record if you prefer the older name: that call's parameters, its local variables, and the address to jump back to. Calling a function pushes one. Returning pops it.

You cannot jump into the middle of the stack or out of it. A function returns to its caller and nowhere else, so frames come off in exactly the reverse of the order they went on.

## One call, in detail

```cpp
void func2(int &x, int y, int z) {
    x += y + z;
}

int func1(int a, int b) {
    int result {};
    result = a + b;
    func2(result, a, b);
    return result;
}

int main() {
    int x {10}, y {20}, z {};
    z = func1(x, y);        // 60
}
```

Three functions, and at the deepest point all three are live at once. `main` is waiting on `func1`, which is waiting on `func2`.

`result` lives in `func1`'s frame. `y` and `z` live in `func2`'s frame, as copies of what was passed in. And `x` is a reference, so it holds the address of `result` and points down into the frame below:

```text
  ┌──────────────────────────────┐
  │ func2   y=10  z=20  x ───────┼──┐
  │         return address       │  │
  ├──────────────────────────────┤  │
  │ func1   a=10  b=20           │  │
  │         result = 30 ◀────────┼──┘
  │         return address       │
  ├──────────────────────────────┤
  │ main    x=10  y=20  z        │
  └──────────────────────────────┘
```

`func2` adds 10 and 20 to whatever that reference points at, so `result` becomes 60. Then its frame is gone, `func1` returns 60, and that frame goes too.

The bookkeeping underneath is mechanical, and the compiler emits all of it: push the parameters and the address to come back to, jump, and on the way out restore the caller's frame along with any registers the callee saved.

ABIs differ in the details and much of it happens in registers, but the shape holds. A fixed cost per call, paid whether or not the function does anything. That is why `inline` exists.

## Why a local dies at the closing brace

Local variables are not preserved between calls. That gets taught as a scope rule, and scope is real: an identifier is visible only inside the block where it was declared.

But the reason the value is gone next time has nothing to do with visibility. The frame it lived in was popped.

One keyword changes the answer:

```cpp
void tick() {
    static int calls {0};   // not in the frame
    calls++;
}
```

`static` moves that variable out of the activation record entirely. It is initialised once, the first time control reaches the declaration, and holds its value across every later call because there is no frame to take it away. Leave off the initialiser and it is zero rather than garbage. Globals are the same storage with wider visibility.

Storage duration, not scope.

## The four regions

Everything a running program has is one of four things:

```text
  ┌──────────────────────────────────────────────┐
  │  Heap, also called the free store            │
  │  new and delete, sized at run time           │
  │                                              │
  │                          ▼ grows             │
  ├──────────────────────────────────────────────┤
  │                          ▲ grows             │
  │                                              │
  │  Stack                                       │
  │  one frame per call in progress              │
  ├──────────────────────────────────────────────┤
  │  Static and global                           │
  │  one slot each, alive for the whole run      │
  ├──────────────────────────────────────────────┤
  │  Code                                        │
  │  the compiled instructions themselves        │
  └──────────────────────────────────────────────┘
```

That is a schematic, not an address map: on Linux the stack sits high and grows down while the heap sits low and grows up. What holds everywhere is the regions and their lifetimes. Code never changes, the static area lasts the whole run, the stack tracks call depth exactly, and the two growable regions face each other because they compete for the same unallocated space.

## Why the stack has a ceiling and the heap does not

A frame is not an object anything tracks. It is a range of bytes underneath a pointer, and the pointer lives in a register. Pushing subtracts from it. Popping adds. Allocation and deallocation are one arithmetic instruction each, with no free list, no metadata and no fragmentation, which is why stack allocation is effectively free.

The price is contiguity. Every live frame sits at a known offset from that pointer, and pointers into those frames are scattered through registers and other frames. Growing the region means moving it somewhere bigger, which invalidates all of them. C++ cannot find them: it has no idea which words in a frame are addresses and which are integers that happen to look like addresses.

So the size is chosen once, when the thread is created, and never changes. On Linux the main thread typically gets eight megabytes, set by `ulimit -s`; additional threads get whatever you asked for at creation.

The heap never made that promise. It hands out individual blocks that need not be near each other, and can ask the operating system for more pages anywhere in the address space. `new` fails when the machine runs out, not when a region fills up.

Run off the end and you hit a guard page the kernel put there for exactly this. The program dies. Handling it would mean calling a function, and there is no room left for the frame.

Two ways to get there, and only one is famous. A single frame can be too large by itself: a local array of a few million elements is a few million elements of stack, requested in one instruction. The other route is recursion, which changes nothing about the mechanism. Each call gets its own frame, so `factorial(n)` bottoms out at n+1 of them, one per multiplication waiting on the one below.

So a recursion limit is a frame budget, not an arbitrary rule, and how many frames fit depends on how large each one is. That is why nobody quotes a precise number: add a local buffer to the recursive function and the depth you can reach drops. The limit did not change. The frames got fatter. C++ does not guarantee tail-call elimination either, so a recursion that is fine at `-O2` can be a crash at `-O0`.

## What this explains in Go and Node

V8 gives each isolate a fixed stack, well under a megabyte by default and raisable with `--stack-size`. It surfaces as a `RangeError`, which makes it look like an ordinary catchable exception, and the appearance is the only thing that differs. The depth at which it throws shifts with what your functions carry.

Go genuinely does something else. A goroutine starts with a two kilobyte stack, and the compiler emits a check in the prologue of every function that needs one: is there room for this frame? If not, the runtime allocates a larger stack, copies the live frames into it, rewrites every pointer that referred to the old location, and lets the function carry on as though nothing happened. The stack grows by moving.

Copying is exactly what C++ cannot do. Fixing up those pointers requires knowing which words in every live frame point into the stack, and the Go runtime knows because it already needs precise maps for the garbage collector. That information does not exist in a compiled C++ binary.

You feel that twice. A goroutine costs two kilobytes to start rather than a thread's full reservation plus a kernel task, so a hundred thousand of them is unremarkable. And deep recursion behaves differently: the goroutine keeps growing until it hits the runtime's own ceiling, one gigabyte on 64-bit by default, instead of dying at whatever its thread was handed. When it does, you get `fatal error: stack overflow`, and `recover` will not save you for the same reason C++ cannot.

It is also why cgo forbids C code from keeping a Go pointer after the call returns: the stack it points into may not be there later.

All of it comes down to one decision, made once per language: is the region allowed to move? Go said yes and pays a bounds check in every function prologue. C++ said no and hands you a segfault instead.
