#include <stdio.h>
#include <stdlib.h>

FILE* fp;
int input2;
int max_size=200;

void smashme(char *input1)
{
    printf(input1);
    
    char input3[96];
    
    printf("\n please enter a number (1-10)\n");
    scanf("%d",&input2);
    
    fp = fopen ("input.txt", "r");
    if(fp == NULL)
    {
        printf("Error opening file\n");
        exit(1);
    }
    fgets (input3, max_size, fp);
}
int main(int argc, char *argv[])
{
  if (argc != 2)
    {
      fprintf(stderr, "argc != 2\n");
      exit(EXIT_FAILURE);
    }

    smashme(argv[1]);

    return 0;

}


