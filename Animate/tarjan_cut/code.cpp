// C++ implementation of Tarjan's Cut Vertex (割点) algorithm
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int maxn = 1e6+5;
const int maxe = 1e6+5;

int n,m;

struct linkList {
    typedef struct {int u,v,w,next;} edge;
    edge e[maxe];
    int h[maxn],edge_cnt=0;
    linkList(){
        edge_cnt=0;
        memset(h,-1,sizeof(h));
    }

    void add(int u,int v,int w=0){
        e[++edge_cnt] = {u,v,w,h[u]};
        h[u] = edge_cnt;
    }
    void add2(int u,int v,int w=0){
        add(u,v,w);
        add(v,u,w);
    }
    edge& operator[](int i){ return e[i]; }
    int operator()(int u){ return h[u]; }
} e;

int dfn[maxn],low[maxn];
int dfs_time;
bool cut[maxn];

void tarjan(int u,int fa) {
    int child = 0;
    // [start] tarjan_enter
    dfn[u] = low[u] = ++dfs_time;
    // [end] tarjan_enter

    for(int i = e.h[u]; ~i;i = e.e[i].next) { // [start] tarjan_check_edge
        int v = e.e[i].v;
        // [end] tarjan_check_edge

        if(v == fa) // [start] tarjan_skip_parent
            continue;
        // [end] tarjan_skip_parent

        if(!dfn[v]) {
            tarjan(v,u);
            child++;

            // [start] tarjan_update_low_child
            low[u] = min(low[u],low[v]);
            // [end] tarjan_update_low_child

            if(fa != 0 && low[v] >= dfn[u]) // [start] tarjan_cut_found
                cut[u] = true;
            // [end] tarjan_cut_found
        }
        else {
            // [start] tarjan_update_low_back
            low[u] = min(low[u],dfn[v]);
            // [end] tarjan_update_low_back
        }
    }

    if(fa == 0 && child > 1) // [start] tarjan_root_cut
        cut[u] = true;
    // [end] tarjan_root_cut
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

    for(int i = 1;i <= n;i++)
        if(!dfn[i]) tarjan(i,0);

    cout << "Cut vertices: ";
    for(int i = 1;i <= n;i++)
        if(cut[i]) cout << i << " ";
    cout << endl;

    return 0;
}
