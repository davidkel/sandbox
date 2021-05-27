package main

/*
#cgo linux LDFLAGS: -ldl
#include <stdio.h>
#include <unistd.h>
#include <dlfcn.h>

void Hello();
void badfp();
int level1(char*, void*);
int level2(char*, void*);
int level3(char*, void*);
void badp();

void Hello() {
	printf("Hello Dave, loading module\n");
	void* handle = dlopen("./libbadjump.so", RTLD_LAZY);
	printf("shared library loaded, handle %p\n", handle);
	void* procAddr = dlsym(handle, "badptr");
	printf("function loaded, address %p\n", procAddr);
	sleep(1);
	level1("level 1 again", procAddr);
}

void Sleep() {
	printf("Sleeping for 10 seconds\n");
	sleep(10);
}

void QuickSleep() {
	printf("Sleeping for 5 seconds\n");
	sleep(2);
}

int level1(char* str, void* vfn) {
	printf("level1: %s\n", str);
	int u = level2("level2 again", vfn);
        return 1;
}

int level2(char* str, void* vfn) {
	printf("level2: %s\n", str);
	int u = level3("level 3 again", vfn);
	return 2;
}

int level3(char* str, void* vfn) {
	printf("level3 calling badfp: %s\n", str);
	badp(vfn);
    return 3;
}

void badfp(void* vfn) {
   printf("about to call a bad function\n");
   sleep(1);
   void (*badjump)(void *);
   badjump = (void (*)())vfn;
   void (*fn)();
   fn = (void (*)())0xc00000000;
   //fn = (void (*)())0x1;
   printf("calling badjump %p, with %p\n", badjump, fn);
   badjump(fn);
   printf("Exiting badfp\n");
}

void badp(void* vfn) {
   printf("about to call a bad address\n");
   sleep(1);
   void (*badptr)();
   badptr = (void (*)())vfn;
   //int *i = 0;
   //*i = 1;
   badptr();
}
*/
import "C"

import (
	"fmt"
	"runtime"
	"time"
)

func main() {
	fmt.Println("Welcome", runtime.GOMAXPROCS(0))
	go func() {
		fmt.Println("In first go routine")
		C.Sleep()
		fmt.Println("Exit first go routine")
	}()
	go func() {
		fmt.Println("In 2nd go routine")
		//C.Sleep()
		DoLoop()
		fmt.Println("Exit 2nd go routine")
	}()
	go func() {
		fmt.Println("In 3rd go routine")
		//C.Sleep()
		DoLoop()
		fmt.Println("Exit 3rd go routine")
	}()
	go func() {
		fmt.Println("In bad go routine")
		C.Hello()
	}()

	go func() {
		fmt.Println("In nil pointer go routine")
		C.QuickSleep()
		//var i *int = nil
		//*i = 1
		fmt.Println("Exit 3rd go routine")
	}()

	fmt.Println("About to start loop")
	//t0 := time.Now()
	//C.QuickSleep()
	//Duration(t0)
	//fmt.Println("Ending quicksleep")
	DoLoop()
}

func Duration(t0 time.Time) {
	t1 := time.Now()
	fmt.Printf("The call took %v to run.\n", t1.Sub(t0))
}

func DoLoop() {
	fmt.Println("Starting loop")
	var i int
	for i = 1; i < 10000000000; i++ {
		if i%1000 == 0 {
			//fmt.Println(i)
			_ = i * i
		}

	}
	fmt.Println("loop complete", i)

}
