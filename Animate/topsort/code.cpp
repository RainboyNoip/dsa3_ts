//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-12-16 08:09:17
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int maxn = 1e6+5;
const int maxe = 1e6+5;

int n,m;
int in_deg[maxn]; //每个点的入度 

//图的存储结构,linkList
struct linkList {
    typedef struct {int u,v,w,next;
        int pre; //比这条边新的同起点的边的编号,这里是一个前驱,一个双向的链表
    } edge;
    edge e[maxe];
    int h[maxn],edge_cnt=0;
    linkList(){
        edge_cnt=0;
        memset(h,-1,sizeof(h));
    }

    //遍历点u 周围点
    template<typename U>
    void for_each(int u,U func){
        for(int i = h[u] ; i !=-1;i = e[i].next)
            func(e[i].u,e[i].v,e[i].w); //u v w
    }

    void add(int u,int v,int w=0){
        e[edge_cnt] = {u,v,w,h[u]}; //创建了一条新的边
        e[edge_cnt].pre = -1; //最新的这条边没有前驱
        e[h[u]].pre = edge_cnt; //前驱是这条边
        h[u] = edge_cnt++;
    }
    void add2(int u,int v,int w=0){
        add(u,v,w);
        add(v,u,w);
    }
    //下标访问
    edge& operator[](int i){ return e[i]; }
    //返回head[u]
    int operator()(int u){ return h[u]; }
} e;


template<typename T = int,int siz = maxn>
struct myqueue{
    T a[siz+5];
    //tail 指向最后一个元素后面一个位置
    //head 指向第一个元素
    int head = 0,tail=0; 

    void clear() { head =tail = 0;}

    void push(T b) { a[tail++] = b;}

    void pop(){head++;}
    void pop_back(){tail--;}

    T front() { return a[head];}
    T back() { return a[tail-1];}

    bool empty() { return head == tail;}

    int size() { return tail-head;}
};



//存topsort的结果
int ta[maxn];
int ta_cnt;
myqueue<int> que; //队列

void topsort() {
    // 把入度为0的点加入队列里
    for(int i = 1;i <= n ;++i ) // [start] push zero in_deg point
    {
        if( in_deg[i] == 0) que.push(i);
    }// [end] push zero in_deg point

    //队列不空
    while( !que.empty())
    {
        int u = que.front(); // [start] get u from que
        que.pop();
        //放到结果队列里
        ta_cnt++;
        ta[ta_cnt] = u; // [end] get u from que

        for(int i = e.h[u]; ~i;i = e.e[i].next) 
        {
            int v = e.e[i].v; // [start] get v from u
            --in_deg[v]; // [end] get v from u
            if( in_deg[v] == 0) que.push(v); // [start end] push v to que
        }
    }
}


//读取数据
void init() {
    cin >>n >> m; //读取n个结点, m条边
    for(int i =1;i<=m;i++) {
        int u,v;
        cin >> u >> v;
        in_deg[v]++;
        e.add(u,v); //有向图存图,只加一次
    }
}


int main () {
    std::ios::sync_with_stdio(false); cin.tie(0); cout.tie(0); // 关闭io同步
    init();
    topsort();

    //输出topsort结果
    for(int i = 1;i <= ta_cnt ;++i ){
        cout << ta[i] <<" ";
    }
    cout << endl;

    return 0;
}
