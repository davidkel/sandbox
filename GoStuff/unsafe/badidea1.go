package main

import (
	"fmt"
	"unsafe"
)

type allowed interface {
	getName() string
}

type first struct {
	name string
}

func (fi first) getName() string {
	return fi.name
}

type full struct {
	first
	last string
}

func (fu full) getName() string {
	return fu.name
}

func (fu full) getLast() string {
	return fu.last
}

func main() {
	fmt.Println("Hello, playground")
	ff := create("Dave", "Kelsey")
	fmt.Println(ff.getName())
	t1 := unsafe.Pointer(&ff)
	fmt.Printf("type %T\n", t1)
	t2 := (*full)(t1)
	fmt.Printf("type %T\n", t2)
	t3 := *t2
	fmt.Printf("type %T\n", t3)
	//fmt.Println(t3)
	//fmt.Println(t3.getName())
	fmt.Println(t3.getLast())

	// *(*uint64)(unsafe.Pointer(&f))

}

func create(name, last string) allowed {
	ff := full{}
	ff.name = name
	ff.last = last
	return ff
}
