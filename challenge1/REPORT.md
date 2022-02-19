- [Part1](#part1)
  - [Vulnerability](#vulnerability)
  - [Canary](#canary)
  - [Attack](#attack)
  - [Buffer Size](#buffer-size)
  - [Format String](#format-string)
  - [Shell Code](#shell-code)
  - [Script](#script)
    - [Structure](#structure)
    - [Variables](#variables)
    - [Reserved Stack For Shell](#reserved-stack-for-shell)
    - [Return Address](#return-address)
    - [Execution](#execution)
  - [Demo](#demo)
- [Part2](#part2)
  - [Vulnerability](#vulnerability-1)
  - [Attack](#attack-1)
  - [Challenge](#challenge)
  - [Script](#script-1)
    - [Execution](#execution-1)
  - [Demo](#demo-1)

# Part1

You asked us to just explain how to execute the scripts but for the sake of completeness I'll explain the whole process here. 

**You can directly jump to [Execution](#execution) to understand how to run script.**

**The link to recorded video is available in [demo](#demo) section.**

## Vulnerability

By reading code carefully we can find 2 vulnerabilities here:
1. *Format String*: At line `10` we can see this vulnerability, `printf` function is used without determining any formatting:
   
  ```
      printf(input1);
  ```
2. *Buffer Overflow*: At line `23` we can see this vulnerabilitty, `fgets` function is called to read `max_size` characters from `input.txt` file and store them into `input3` buffer. Since the size of `input3` is `96` characters but `max_size` is initialized with `200` so it's obviously a buffer overflow:

    ```
    fgets (input3, max_size, fp);
    ```

## Canary
*Canary* is enabled in this binary which prevent us to simply overflow the buffer.

To see the *Canary* mechanism, we use gdb as below(The specific lines are highlighted):

![An Image of Storing Canary][storingCanary]

This image is just the mechanis of storing *canary* in start of function's context, the validating of canary is located in end of function before returning:

![An Image of Checking Canary][checkingCanary]

## Attack
Obviously, we couldn't overflow buffer without considering the *Canary*! We should smash the stack (and return address) without smashing *Canary*.

So we use *Format String* to read the content of stack(Including *Canary*) then we inject our shellcode but we are carefull to rewrite the canary at the same address.

## Buffer Size
The Buffer is allocated in a new way(at least new to me) so I decided to explain how it is allocated.

Assume our numbers are `2` bytes long. If you have an arbitrary number `Z` then you can decrease it by one unit using adding `0xff` and overflowing it. Samely to decrease it by `2` unit, you can sum it up with `0xfe`, and so on.

Now the line `8` of `smashme` function should be clear to read:

```
 <+8>:     add    rsp,0xffffffffffffff80
```

I leave it as a question for you:
Think how many bytes it's allocating?

*NOTE*: You are not forced to compute the allocated buffer by hand! To get rid of mathematics computation, you can simply use gdb to find the buffer size which is used by me too:)  
To do so, just enter some `A` character into `input.txt` file and then place a breakpoint after `fgets` function, Then look at stack using gdb and count how many bytes are there from first `A` till saved return address.

## Format String
We need to know how many bytes are needed to read from stack to make sure there is canary too!

To find it out, I first determined the saved return address and then I did some trian-and-error to find how many bytes are needed to read.

To find out the saved return address, it's enough to disassamble the `main` function using gdb(same as before):

![Disassembled main function][savedRIP]

The saved return address is equal to `0x40132e`.

*Remember:* The `RIP` always points to next instruction.

>INFO: `RIP` is *Instruction Pointer Register*

## Shell Code
First we should determine which kind of shell code we need to inject! To find it out, we simply use `readelf` program:

```
$ readelf canary -h
ELF Header:
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00 
  Class:                             ELF64
  Data:                              2's complement, little endian
  Version:                           1 (current)
  OS/ABI:                            UNIX - System V
  ABI Version:                       0
  Type:                              EXEC (Executable file)
  Machine:                           Advanced Micro Devices X86-64
  Version:                           0x1
  Entry point address:               0x401130
  Start of program headers:          64 (bytes into file)
  Start of section headers:          17736 (bytes into file)
  Flags:                             0x0
  Size of this header:               64 (bytes)
  Size of program headers:           56 (bytes)
  Number of program headers:         13
  Size of section headers:           64 (bytes)
  Number of section headers:         36
  Section header string table index: 35
```

Considering this information, it's obvious we need a `64-bit` shellcode for AMD(x86_64) processors.

We can generate this shell code on our own using `C` but here, to speed up the process, we use [shellstorm][shellstorm] database to find the suitable one. 

*NOTE:* As mentioned in [exploit file][exploit.py], the shellcode is obtained from [here][shellcodeAddress]

## Script

The script is fully commented and well explained but here I'll try to elaborate things a little bit more:)

The assembly of shellcode is commented at start of [exploit][exploit.py].

### Structure
Here I'm trying to give a visual schema of stack after exploiting it to make further sections more clear:

```
|'''''''''''''''''''''''''''''''''''|
|           NULL_BYTES_1            |
|___________________________________|
|                                   |
|           SHELL_CODE              |
|___________________________________|
|                                   |
|           NULL_BYTES_2            |
|___________________________________|
|                                   |
|             CANARY                |
|___________________________________|
|                                   |
|          BASE_POINTER             |
|___________________________________|
|                                   |
|           RETURN_ADDRESS          |
|      (Points to NULL_BYTES_1)     |
'''''''''''''''''''''''''''''''''''''
```

NOTE: This is not a snapshot of stack! If you want to imagine it on stack, assume low addresses are on top of this picture and respectively, high addresses are on bottom of picture.

### Variables
Here I introduce each used variable in [exploit][exploit.py] file:
1. `SHELL`: Contains the binary of our shellcode (The `SHELL_CODE` section in [Structure](#structure)).
2. `reservedStackForShell`: This variables is filled with `\x90` bytes which represents `nop` operations (The `NULL_BYTES_2` section in [Structure](#structure)). Are you wondering about its name? refer to [Reserved Stack For Shell](#reservedStackForShell) section to read more about it and find out why we named it such way:)
3. `Canary`: This variable is considered to hold the value of *Canary* (The `CANARY` section in [Structure](#structure)).
4. `BP`: This is variable will store the stored *Base Pointer* (The `BASE_POINTER` section in [Structure](#structure)).
5. `RIP`: It's gonna store saved *Return Address* which we want to change it so that it points to our shell code (It's the `RETURN_ADDRESS` section in [Structure](#structure)).
6. `total`: The length of start of `input3` buffer till `Canary` in bytes.
7. `mainStackSize`: size of stack of `main` function before calling `smashme` function. we want to compute the desired *Return Address* automatically hence we need to know this length.
8. `canarySize`: Size of *Canary* which is 8 bytes.
9. `BPSize`: Size of *Base Pointer* which is 8 bytes.
10. `RIPSize`: Size of *Return Address* which is 8 bytes.
11. `SHELLSize`: Size of *Shell* which we want to inject.
12. `guard`: We wanna change *RIP* to pionts to somewhere in `NULL_BYTES_1` (refere to [Structure](#structure) section.). This variable determines how much distance we will have, to reach shell after reading smashed *RIP*.

### Reserved Stack For Shell

If you pay attention to the assembly of shell code, you will see some instructions (i.e. `push`) which manipulate stack to prepare shell's arguments!  
Hence if we place the shell at end of buffer(I means the lowest addresses), the shell will destroy itself because by pushing its arguments, it will replace its instructions.

So to avoid this problem, we should reserve some place for shell to locate its arguments in stack.  
This variable does this job:)


### Return Address
After using *Format String* vulnerability, we will extract needed information from output such as *Canary*, *Return Address*, *Base Pointer* and etc.

From this information we just need to keep the *Canary* because we want to rewrite it!  
After it we need to change return address to execute our shell.

In this section I want to explain why below line compute the new return address correctly:

```
RIP = pack(int(BP, 16) - mainStackSize - canarySize - BPSize - RIPSize - SHELLSize - guard - len(reservedStackForShell)
```

We use the *Base Pointer* to compute the new return address:
1. *Base Pointer(BP)* points to start of stack in `main` function --> `BP`
2. If we add size of stack of `main` function, we will reach the *Stack Pointer(SP)* which contains the *Saved Return Address* --> `mainStackSize`
3. Samely we add size of *Saved Base Pointer*, *Saved Return Address* and *Canary* to reach *Base Pointer* of `smashme` function which is start of stack of `smashme` function --> `BPSize + RIPSize + canarySize`.
4. As we discussed in [Reserved Stack For Sheel](#reserved-stack-for-shell), we need to leave some space for arguments of shell --> `len(reservedStackForShell)`.
5. Now we place the shell --> `SHELLSize`.
6. There is always a possibility of mistakes in computation:) so instead of pointing to start of shell exactly, we leave some space as guard and points to somewhere lower in addresses --> `guard`.

### Execution

To execute my code, you just need to have `python3` installed on your system.

If you have it, then run it from compiler simply:

```
$ ./exploit.py
```

**NOTE:** After running the exploit, you need to press a key to let the script continue running then it will give you the shell.

## Demo


# Part2

You asked us to just explain how to execute the scripts but for the sake of completeness I'll explain the whole process here. 

**You can directly jump to [Execution](#execution-1) to understand how to run script.**

**The link to recorded video is available in [demo](#demo-1) section.**


**NOTE:** This code is even better commented and self-explained than *Part 1*'s script so here I'll explain less. Also please note that some of works done here are similar to *Part 1*(e.g. Finding buffer size and etc), Hence I'll avoid to repeat them and try to make the documentation short.

## Vulnerability
This code has one vulnerability which is *Buffer Overflow*. You can find this vulnerability at line `49`:

```
  fscanf(fp, "%s", input);
```

The size of `input` buffer is `100` bytes but we are reading from file without any limitation.

## Attack

As mentioned in the question, the *Non-Executable stack* feature is activated for this code and we should make a ROP attack.

All the code we need to execute a shell is available inside the code, we should just connect this seperate parts to reach a shell.

To do so, we first need to find addresses of each function and which arguments it needs. To find this information we just need `gdb` and its `disassemble` command.

## Challenge

The arguments of `correct_answer()` and `wrong_answer()` functions are located on the stack and before saving return address. We should some way to place a wrong return address but without any side effect to bypass this challenge.

The complete solution is commented inside [script][exploit2].

Just as a hint: The point we utilize here is that calling `execve` with wrong arguments results in returning `-1` and doesn't abort the process execution.

## Script

[Script][exploit2] is relatively simple and straight forward! we just first call the `correct_answer()` to write `/bin` into buffer, then we call `wrong_answer()` to concat `//sh` with `/bin` into buffer. Finally we call `Access_Shell()` to execute and obtain shell.

**NOTE:** Refere to [Script][exploit2] and read comments to understand the details.

### Execution
The execution of [this script][exploit2] is same as [part1's script][exploit.py].

To run exploit this program, you need to have `python3` installed on your system then you can run the script simply on your terminal by:

```
$ ./exploit.py
```

## Demo


[shellstorm]: http://shell-storm.org/shellcode/
[exploit.py]: ./part1/exploit.py
[shellcodeAddress]:  http://shell-storm.org/shellcode/files/shellcode-806.php
[storingCanary]: ../resources/challenge1-part1-storingCanary.png
[checkingCanary]: ../resources/challenge1-part1-checkingCanary.png
[savedRIP]: ../resources/challenge1-part1-savedReturnAddress.png
[exploit2]: ./part2/exploit.py