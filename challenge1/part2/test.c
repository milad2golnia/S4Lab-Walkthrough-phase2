#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

char bin_sh[10];
FILE *fp;

void correct_answer(int name1)
{
    if (name1 == 0xdabbadaa)
    {
        strcpy(bin_sh, "/bin");
        printf("Noooo!\n");
    }

}

void wrong_answer(int name1, int name2, int name3)
{
    if (name1 == 0xfacebaad || name2 == 0xfacefeed || name3 == 0xfacedead)
    {
        strcpy(bin_sh+4, "//sh");
        printf("Do you mean facebook? Yeees!\n");
    }
    else if(name1==0xD0D0CACA || name2==0xB105F00D)
    {
        strcpy(bin_sh, "/LOL");
        printf("Do you Mark Zuckerberg?!\n");
    }
}

void Access_Shell() 
{
    execve(bin_sh,0,0);
}

void read_file(char* name)
{
    char input[100];
    fp = fopen ("input.txt", "r");
    if(fp == NULL)
    {
        printf("Error opening file\n");
        exit(1);
    }
    correct_answer(0xdabbadaa);
    Access_Shell();
    printf(" Hello %s :)) \n can you name one of the big five companies in information technology in U.S.? \n ",name);
    printf("write your answer in input.txt before running this program :))\n");
    fscanf(fp, "%s", input);
}
int main(int argc, char** argv)
{
    if (argc != 2)
    {
      fprintf(stderr, "argc != 2\n");
      exit(EXIT_FAILURE);
    }
    read_file(argv[1]);
    return 0;
}

