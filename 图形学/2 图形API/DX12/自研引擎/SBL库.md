
```c++
//文件地址
simple_librar/public/simple_core_minimal/

//头文件
#include "simple_library/public/simple_library.h"
```

# 1 simple_file_helper
## API
```c++ nums
void init_def_c_paths(def_c_paths *c_paths);
void init_def_c_paths_w(def_c_paths_w* c_paths);

// 拷贝文件
int copy_file(char *Src, char *Dest);

// 查找文件（第3个参数确定是否递归查找）
void find_files(char const *in_path, def_c_paths *str,bool b_recursion);

bool is_file_exists(char const* filename);

// 创建文件夹
bool create_file(char const *filename);

// 创建路径
bool create_file_directory(char const *in_path);

// 打开地址
bool open_url(const char* url);

// 通过参数打开url
bool open_url_by_param(const char* url, const char* param);

// 通过操作打开某个东西
bool open_by_operation(const char* in_operation, const char* url, const char* param);

// 打开一个文件夹
bool open_explore(const char* url);

// 使用以下接口 一定要初始化buf
char buf[1024] = { 0 };

bool get_file_buf(const char *path,char *buf);

bool save_file_buff(const char* path, char* buf);

bool add_file_buf(const char *path, char *buf);

// 这个函数是以字符串的方式存储，如果数据中有0 自动截断，建议用二进制存储
bool add_new_file_buf(const char *path, char *buf);

// 这个是以二进制方式读取
bool load_data_from_disk(const char* path, char* buf);
// 获取文件大小
unsigned int get_file_size_by_filename(const char *filename);

unsigned int get_file_size(FILE *file_handle);

// 这个是以二进制方式存储，不会遇到像0自动截断的情况
bool save_data_to_disk(const char* path, char* buf, int buf_size);


```

```c++ nums
// 宽字符和窄字符
// 
// 宽字符转窄字符
_number_of_successful_conversions(size_t) wchar_t_to_char(
	_out_pram(char*) dst_char,
	size_t char_size,
	_in_pram(wchar_t const*) _Src);

// 窄字符转宽字符
_number_of_successful_conversions(size_t) char_to_wchar_t(
	_out_pram(wchar_t*) dst_wchar_t,
	size_t wchar_t_size,
	_in_pram(char const*) _Src);
```

```c++ nums

// 宽字符
//////////////////////////////////////////////
// 这个函数是以字符串的方式存储，如果数据中有0 自动截断，建议用二进制存储
bool add_new_file_buf_w(const wchar_t* path, char* buf);

bool get_file_buf_w(const wchar_t* path, char* buf);

// 这个是以二进制方式存储，不会遇到像0自动截断的情况
bool save_data_to_disk_w(const wchar_t* path, char* buf,int buf_size);

// 这个是以二进制方式读取 buf的大小要比实际大小+1 因为最后一位留给/0
bool load_data_from_disk_w(const wchar_t* path, char* buf);

bool is_file_exists_w(const wchar_t *filename);

// 打开地址
bool open_url_w(const wchar_t* url);

bool open_url_by_param_w(const wchar_t* url,const wchar_t *param);

bool open_by_operation_w(const wchar_t *in_operation, const wchar_t* url, const wchar_t* param);

// 打开一个文件夹
bool open_explore_w(const wchar_t* url);

unsigned int get_file_size_by_filename_w(const wchar_t* filename);
```
##  打开文件操作
`_open_url`地址可以是网站，也可以是本地文件
```c++ nums
open_url("http://renzhai.net/");
open_url("C:/Test/hello.bmp");
//open_url_w(L"http://renzhai.net/"); //宽字符
```

## 读取磁盘二进制文件

```c++ nums
char path[] = "C:/Test/hello.bmp";
char bmp[1024] = { 0 };
load_data_from_disk(path, bmp);
```

##  获取文件大小
```c++ nums
int size = get_file_size_by_filename("C:/Test/hello.bmp");
```

## 存储数据到磁盘
```c++ nums
char path[] = "../test.txt";
char buf[1024] = { 0 };
save_data_to_disk(path, buf, strlen(buf));
```

C 库函数 `size_t strlen(const char *str)` 计算字符串 **str** 的长度，直到空结束字符，但不包括空结束字符。
## 窄字符宽字符转换
```c++ nums
// 宽字符转窄字符
wchar_t path_w[] =L"../test.txt";
char path[1024] = { 0 };
wchar_t_to_char(path, sizeof(path), path_w);
cout << path << endl;

// 窄字符转宽字符
char path[] = "../test.txt";
wchar_t path_w[1024] = { 0 };
char_to_wchar_t(path_w, 1024,path);
cout << path_w << endl;
```

## 创建文件和文件夹
**创建文件**
```c++ nums
char path[] = "C:/Users/22625/Desktop/LearnSBL/test.txt";
create_file(path);
```

**创建文件夹**
在地址 `C:/Users/22625/Desktop/LearnSBL/LearnSBL` 后创建文件夹 `TestCreatFiles` 及其子文件夹 ` FileA `
```c++ nums
char path[] = "C:/Users/22625/Desktop/LearnSBL/LearnSBL/TestCreatFiles/FileA";
create_file_directory(path);
```

## 递归查找文件
```c++ nums
char path[] = "C:/Users/22625/Desktop/LearnSBL/LearnSBL";
def_c_paths c_paths;
memset(&c_paths, 0, sizeof(def_c_paths)); //初始化
find_files(path, &c_paths, true);
```


# 2 simple_path
## API
```c++ nums
// 获取path_buf路径的身体
void get_path_directory_inline(char *path_buf);
// 获取path_buf路径的身体并拷贝到buf
void get_path_directory(char *buf, const char *path_buf);
// 归一化路径：文件路径中的"\\"转换成"/"
void normalization_path(char *path_buf);
// 获取path_buf路径的头部并拷贝到buf
void get_path_clean_filename(char *buf, const char *path_buf);
// 归一化路径：path_buf路径中的"/"转换成"\\",并拷贝到buf,并只获取身体
void normalization_directory(char *buf, const char *path_buf);

char* get_full_path(char* in_path_buf, int in_buff_len,const char *in_path);

void get_path_clean_filename_w(wchar_t* buf, const wchar_t* path_buf);
```

##  获取路径的身体

```c++ nums
char path[] = "C:/LearnSBL/test";
get_path_directory_inline(path);
cout << path << endl;
// 输出：test的上层路径：C:/LearnSBL/

char path1[1024] = "C:/LearnSBL/test";
char path2[1024] = { 0 };
get_path_directory(path2, path1);
cout << path2 << endl;
// 输出：test的上层路径：C:/LearnSBL/
```
## 获取路径的头部
```c++ nums
char path1[1024] = "C:/LearnSBL/test";
char path2[1024] = { 0 };
get_path_clean_filename(path2, path1);
cout << path2 << endl;

//输出：test
```
## 归一化路径
将文件路径中的`\\`转换成`/`
```c++ nums
char path[1024] = "C:\\LearnSBL\\test";
normalization_path(path);
cout << path << endl;

//输出：C:/LearnSBL/test
```
# 3 simple_guid
guid：全局唯一标识符（Globally Unique Identifier）
作用：描述程序和对象的唯一性，防止重复，可用于加密。
**引擎会实现类似于 UE 中的 Uobject 的对象，标志对象本身的身份，防止身份重复**


本库产生的字符串格式的guid 为随机值，格式如下：
```c++ nums
6EDEF5244933469C10753AB40C944268
```

API：
```c++ nums
// guid数据结构，变量类型为simple_c_guid
typedef struct
{
    unsigned int a;
    unsigned int b;
    unsigned int c;
    unsigned int d;
}simple_c_guid;

// 创建guid
void create_guid(simple_c_guid* c_guid);

// 创建字符串格式的guid
void create_guid_str(char* c_guid);

// 判断guid是否有意义：guid全部为0时无意义
bool is_guid_valid(simple_c_guid* c_guid);

// 判断字符串guid是否有意义
bool is_guid_valid_str(const char* c_guid);

// 归一化guid：将guid清零
void normalization_guid(simple_c_guid* c_guid);

// guid转字符串
void guid_to_string(char *buf, const simple_c_guid * c_guid);

// 字符串转guid
void string_to_guid(const char* buf, simple_c_guid* c_guid);

// guid相等判定
bool guid_equal(const simple_c_guid * c_guid_a, const simple_c_guid * c_guid_b);

// 字符串格式的guid相等判定 
bool guid_equal_str(const char *guid_string, const simple_c_guid * c_guid);
```

# 4 simple_c_time
时间操作，用到再讲
# 5 simple_c_windows
## simple_c_windows_setting.h
Windows 控制台字体着色
```c++
// （字体颜色，背景颜色）
set_console_w_color(simple_console_w_color::SIMPLE_LIGHT_BLUE, simple_console_w_color::SIMPLE_BRIGHT_WHITE);
cout << "hello" << endl;
```

![[Pasted image 20230406110626.png]]

## simple_c_windows_register. h
修改注册表 (需要管理员权限)，可以实现类似 ue 右键菜单选项的功能

![[Pasted image 20230406112443.png]]
# 6 simple_delegate
代理：单播和多播, 网络相关的暂时不学
# 7 simple_c_string_algorithm
```c++ nums

// 移除子字符串""
void SIMPLE_LIBRARY_API remove_string_start(char *str, char const* sub_str);
// 从前往后移除字符''
void SIMPLE_LIBRARY_API remove_char_start(char* str, char sub_str);
// 从后往前移除字符''
void SIMPLE_LIBRARY_API remove_char_end(char* str, char sub_str);
// 从后往前移除所有字符''
void SIMPLE_LIBRARY_API remove_all_char_end(char* str, char sub_str);

//从后往前找子字符串，返回索引
int SIMPLE_LIBRARY_API find_string_from_end(const char* str, char const* sub_str, int start_pos);

//从前往后找子字符串，返回索引
int SIMPLE_LIBRARY_API find_string(const char *str, char const* sub_str,int start_pos);

//判定字符串是否包含
bool SIMPLE_LIBRARY_API c_str_contain(const char* buff_str,const char *sub_str);

//前后空格都修掉
void SIMPLE_LIBRARY_API trim_start_and_end_inline(char* buff);

//去除前面的空格
void SIMPLE_LIBRARY_API trim_start_inline(char *buff);
//去除后面的空格
void SIMPLE_LIBRARY_API trim_end_inline(char *buff);

//拆分
bool SIMPLE_LIBRARY_API split(const char *buf,const char* str_split,char *l,char *r, bool bcontain_str_split);


// 在内部替换字符串，将子字符串a替换为子字符串b
void SIMPLE_LIBRARY_API replace_string_inline(char* str,const char* sub_char_a,const char* sub_char_b);
// 在内部替换字符，将子字符a替换为子字符b
void SIMPLE_LIBRARY_API replace_char_inline(char *str, const char sub_char_a, const char sub_char_b);

int SIMPLE_LIBRARY_API get_printf(char *buf, const char *format, ...);

int SIMPLE_LIBRARY_API get_printf_s(char *out_buf, const char *format, ...);

int SIMPLE_LIBRARY_API get_printf_s_s(int buffer_size,char *out_buf, const char *format, ...);
// 切割指定的字符串
char SIMPLE_LIBRARY_API*string_mid(const char *int_buf ,char *out_buf,int start,int count);

// 窄字符串转宽字符串
int SIMPLE_LIBRARY_API char_to_tchar(const char *str, wchar_t *tc);
// 宽字符串转窄字符串
int SIMPLE_LIBRARY_API tchar_to_char(const wchar_t *tc, char *str);

//注意 ：str 必须是足够大的空间 不要传一个自动匹配内存的指针
void SIMPLE_LIBRARY_API wremove_string_start(wchar_t *str, wchar_t const* sub_str);

int SIMPLE_LIBRARY_API wfind_string(wchar_t *str, wchar_t const* sub_str);

void SIMPLE_LIBRARY_API wremove_wchar_start(wchar_t *str, wchar_t sub_str);

void SIMPLE_LIBRARY_API wremove_wchar_end(wchar_t *str, wchar_t sub_str);

void SIMPLE_LIBRARY_API wremove_all_wchar_end(wchar_t *str, wchar_t sub_str);

void SIMPLE_LIBRARY_API wreplace_wchar_inline(wchar_t *str, const wchar_t sub_char_a, const wchar_t sub_char_b);
void SIMPLE_LIBRARY_API wreplace_string_inline(wchar_t* str, const wchar_t* sub_char_a, const wchar_t* sub_char_b);

// 获取合体字符串（多个字符串存入buf）
int SIMPLE_LIBRARY_API wget_printf(wchar_t *buf, const wchar_t *format, ...);

// 获取合体字符串（宽字符）
int SIMPLE_LIBRARY_API wget_printf_s(wchar_t *out_buf, const wchar_t *format, ...);

int SIMPLE_LIBRARY_API wget_printf_s_s(int buffer_size, wchar_t *out_buf,const wchar_t *format, ...);

wchar_t SIMPLE_LIBRARY_API*wstring_mid(const wchar_t *int_buf, wchar_t *out_buf, int start, int count);

```

