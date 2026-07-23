#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int maxn = 1e6+5;
const int maxe = 1e6+5;

int n,m;
bool vis[maxn]; // 标记点是否已访问

//图的存储结构,linkList
struct linkList {
    typedef struct {int u,v,w,next;} edge;
    edge e[maxe];
    int h[maxn],edge_cnt=0;
    linkList(){
        edge_cnt=0;
        memset(h,-1,sizeof(h));
    }

    template<typename U>
    void for_each(int u,U func){
        for(int i = h[u] ; i !=-1;i = e[i].next)
            func(e[i].u,e[i].v,e[i].w);
    }

    void add(int u,int v,int w=0){
        e[edge_cnt] = {u,v,w,h[u]};
        h[u] = edge_cnt++;
    }
    void add2(int u,int v,int w=0){
        add(u,v,w);
        add(v,u,w);
    }
} e;

template<typename T = int,int siz = maxn>
struct myqueue{
    T a[siz+5];
    int head = 0,tail=0;

    void clear() { head =tail = 0;}
    void push(T b) { a[tail++] = b;}
    void pop(){head++;}
    T front() { return a[head];}
    bool empty() { return head == tail;}
    int size() { return tail-head;}
};

myqueue<int> que;

void bfs(int start) {
    // [start] bfs_init
    que.push(start);
    vis[start] = true;
    // [end] bfs_init

    while( !que.empty()) {
        // [start] que_pop
        int u = que.front();
        que.pop();
        // [end] que_pop

        for(int i = e.h[u]; ~i ;i = e.e[i].next ) {
            int v = e.e[i].v;
            // [start] check_adj_edge
            if( vis[v] ) continue;
            // [end] check_adj_edge

            // [start] que_push
            que.push(v);
            vis[v] = true;
            // [end] que_push
        }
    }
}

void init() {
    cin >> n >> m;
    for(int i =1;i<=m;i++) {
        int u,v;
        cin >> u >> v;
        e.add2(u,v);
    }
}

int main () {
    std::ios::sync_with_stdio(false); cin.tie(0); cout.tie(0);
    init();
    bfs(1);
    return 0;
}
