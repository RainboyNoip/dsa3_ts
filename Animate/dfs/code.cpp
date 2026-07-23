//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-12-16 08:09:17
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int maxn = 1e6+5;
const int maxe = 1e6+5;

int n,m;
bool vis[maxn]; //每个点是否被访问

//图的存储结构,linkList
struct linkList {
    typedef struct {int u,v,w,next;} edge;
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
        e[edge_cnt] = {u,v,w,h[u]};
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

//读取数据
void init() {
    cin >>n >> m; //读取n个结点, m条边
    for(int i =1;i<=m;i++) {
        int u,v;
        cin >> u >> v;
        e.add2(u,v); //无向图存图,加两次
    }
}

void dfs(int u,int fa) {
    vis[u] = 1; // [start] dfs_set_visited
    // [end] dfs_set_visited

    for(int i = e(u);i != -1 ;i= e[i].next) // [start] dfs_check_edge
    {
        int v = e[i].v;
        if( v == fa) continue; //跳过父结点
        if( vis[v] == 0) { //没有访问过
            dfs(v,u); //递归访问
        }
        //否则v已经访问过,是返祖边
    } // [end] dfs_check_edge
}

int main () {
    std::ios::sync_with_stdio(false); cin.tie(0); cout.tie(0); // 关闭io同步
    init();
    for(int i =1;i<=n;i++)
    {
        if( vis[i] == 0) //如果没有访问过
            dfs(i,0); // [start end] dfs_start
    }
    return 0;
}
