#include <stdio.h>
#include <unistd.h>

void doit(void (*fn)()) {
    fn();
    int* i = 0;
    *i = 45;
}

void badjump(void (*fn)()) {
    printf("In badjump code jumping to %p\n", fn);
    sleep(1);
    doit(fn);
}

void badptr() {
    printf("In badptr code\n");
    int* i = 0;
    *i = 45;
}