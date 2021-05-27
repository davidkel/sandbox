package main

import (
	"fmt"
	"unsafe"
)

func main() {
	fmt.Println("Hello Dave")
	var i int64 = 1

	// standard cast
	var x uint64 = uint64(i)
	fmt.Println(x)

	// pointer cast, doesn't compile
	// y := (*uint64)(&i)

	y := (*uint64)(unsafe.Pointer(&i))

	fmt.Println(*y)
}
