gcc -O3 -c -Wall -Werror -fPIC badjump.c
gcc -shared -o libbadjump.so badjump.o