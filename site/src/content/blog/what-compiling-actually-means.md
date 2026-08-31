---
title: 'What compiling actually means'
description: 'Source becomes object code, object code becomes a program, and the linker sits between them. The model that go build and every bundler hide from you.'
category: cpp
publishDate: 2026-08-18
tags: ['c++', 'compilers', 'linking', 'fundamentals']
heroGlyph: layers
---

The first C++ error that genuinely stopped me was not a syntax error. It was this:

```text
undefined reference to `Account::withdraw(double)'
collect2: error: ld returned 1 exit status
```

Every line of my code was correct. The class was declared, the method was declared, the call matched the declaration. The compiler had no complaint at all. Something called `ld` did, and I had never heard of it.

That error is only confusing if you think "compiling" is one step. It is at least three, and they fail in different ways for different reasons.

## The pipeline

```text
  main.cpp ─┐
            │  preprocessor      compiler        linker
  file1.cpp ─┼──▶ (text only) ──▶ (per file) ──▶ (whole program) ──▶ main.exe
            │                        │                 ▲
  file2.cpp ─┘                       ▼                 │
                                 main.o ───────────────┤
                                 file1.o ──────────────┤
                                 file2.o ──────────────┤
                                                       │
                          C++ standard library ────────┘
                          other libraries    ─────────┘
```

Four source files go in. One executable comes out. In between, each source file is turned into its own object file, and only at the very end does anything look at the program as a whole.

That last sentence is the whole article, really. Everything confusing about C++ builds follows from it.

## The preprocessor does not understand C++

Before the compiler sees anything, a separate program rewrites your source as text. It handles the lines beginning with `#`, and it has no idea what a class is.

`#include <iostream>` does not "import" anything. It opens that file, pastes its entire contents where the directive was, and does the same for every `#include` inside it, recursively. Comments are stripped here too. By the time the compiler runs, your 40-line file might be 30,000 lines.

This is why include guards exist:

```cpp
#ifndef ACCOUNT_H
#define ACCOUNT_H

class Account {
    // ...
};

#endif
```

If two files both include `account.h`, the naive paste would define `Account` twice in the same translation unit, and defining the same class twice is an error. The guard makes the second paste expand to nothing. It is a textual fix for a textual problem, which is exactly the level the preprocessor works at.

## Each source file is compiled alone

The compiler takes one preprocessed file and produces one object file: your code in machine form, plus a table of the names it defines and the names it still needs.

The important word is *alone*. When the compiler builds `main.o`, it has never seen `account.cpp`. It cannot check whether `Account::withdraw` exists, because it has no way to look.

So it takes your word for it. That is what a declaration is:

```cpp
double withdraw(double amount);   // I promise this exists somewhere
```

The compiler needs the shape of the thing to generate a correct call: how many arguments, what types, what comes back. It does not need the body. It emits the call with a hole where the address should go, records "I need `Account::withdraw(double)`" in the object file, and moves on.

## The linker resolves the promises

The linker collects every object file and every library, and matches each unresolved name against the definitions. Fill in the addresses, write out one executable.

When it cannot find a match, you get the error I opened with. `ld` is the linker. The message is not saying your code is wrong. It is saying you promised a function existed and nobody delivered one.

Once you know that, the causes are a short list:

- You declared it and never wrote the body.
- You wrote the body but never added that file to the build.
- You wrote the body with a slightly different signature, so the name the linker wants and the name you defined are two different names.
- It lives in a library you did not link.

The third one catches everyone at least once. `withdraw(double)` and `withdraw(int)` are separate functions to C++, and the mismatch is invisible until link time.

The rule of thumb that has never failed me: if the error names a *line*, it is the compiler and the problem is in that file. If the error names a *symbol*, it is the linker and the problem is somewhere else in the build.

## What "build" and "clean" mean

Building is compiling plus linking. Your IDE does both when you press the button and hides the object files, which is why the two stages blur together.

"Clean" deletes the object files. It is useful for exactly one reason: object files are cached, and if the build system's idea of what changed is wrong, you can be linking last week's `file2.o` against today's `main.o`. Clean, then rebuild, forces everything through both stages again. On Windows the result is `.exe`; on macOS and Linux it usually has no extension at all.

## Why this matters if you write Go or Node

You may never run a linker by hand. The model still explains things you do hit.

`go build` runs the same stages and prints a single error stream, so the distinction is invisible until you use cgo. Then a missing C library produces a linker error in Go's output, with the same shape and the same causes as the one above.

Node has no build step for your own code, but native modules do. When `npm install` fails partway through compiling something with node-gyp, it is running this pipeline. "Symbol not found" from a native module at require time is a link failure that got deferred to runtime.

Dynamic libraries are the same idea with the last step postponed. A `.so` or `.dylib` is resolved when the program starts rather than when it is built, which is why you can ship a working binary and still get "library not found" on someone else's machine.

The pattern underneath all of them: something recorded a name it needed, and later something else had to find it. Knowing which half failed tells you where to look.
