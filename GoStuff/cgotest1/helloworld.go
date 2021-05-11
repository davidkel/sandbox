package main

/*
#include <stdio.h>
#include <unistd.h>

void Hello();
void badfp();
int level1(char*);
int level2(char*);
int level3(char*);
void badp();

void Hello() {
	printf("Hello Dave\n");
	sleep(1);
	level1("level 1 again");
}

void Sleep() {
	printf("Sleeping for 10 seconds\n");
	sleep(10);
}

void QuickSleep() {
	printf("Sleeping for 5 seconds\n");
	sleep(2);
}

int level1(char* str) {
	printf("level1: %s\n", str);
	int u = level2("level2 again");
        return 1;
}

int level2(char* str) {
	printf("level2: %s\n", str);
	int u = level3("level 3 again");
	return 2;
}

int level3(char* str) {
	printf("level3 calling badp: %s\n", str);
	badfp();
        return 3;
}

void badfp() {
   printf("about to call a bad function\n");
   sleep(1);
   void (*fn)();
   fn = (void (*)())0xc00000000;
   fn = (void (*)())0x1;
   fn();
}

void badp() {
   printf("about to call a bad address\n");
   sleep(1);
   int *i = 0;
   *i = 1;
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
