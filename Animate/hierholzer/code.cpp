//Author by [Rainboy](https://github.com/rainboylvx)
//Hierholzer 算法：求无向图的欧拉路 / 欧拉回路
//输入：n m，接下来 m 行 u v
//输出：一条欧拉路（回路）的顶点序列，不存在输出 NO
#include <bits/stdc++.h>
using namespace std;

const int maxn = 1e6 + 5;

int n, m;
int deg[maxn];                  //每个点的度数
int ptr[maxn];                  //每个点的邻接表扫描到哪了
bool used[maxn];                //每条边是否已经走过
bool vis[maxn];                 //连通性检查用的访问标记
vector<pair<int,int>> g[maxn];  //邻接表，存 (邻点, 边编号)，同一条无向边共享一个编号

int main() {
    scanf("%d %d", &n, &m);
    for (int id = 1; id <= m; id++) {          // [start] read graph
        int u, v;
        scanf("%d %d", &u, &v);
        g[u].push_back({v, id});
        g[v].push_back({u, id});
        deg[u]++;
        deg[v]++;
    }                                          // [end] read graph

    //第 1 步：统计度数，奇度点全部记下来       // [start] find start point
    vector<int> odd;
    for (int i = 1; i <= n; i++)
        if (deg[i] % 2 == 1) odd.push_back(i);
    int first = -1;
    for (int i = 1; i <= n; i++)
        if (deg[i] > 0) { first = i; break; }
    // [end] find start point

    //第 2 步：忽略孤立点，检查有边的点是否连通  // [start] check connected
    if (first != -1) {
        queue<int> q;
        q.push(first);
        vis[first] = 1;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (auto [v, id] : g[u])
                if (!vis[v]) { vis[v] = 1; q.push(v); }
        }
        for (int i = 1; i <= n; i++)
            if (deg[i] > 0 && !vis[i]) { puts("NO"); return 0; }
    }
    // [end] check connected

    //第 3 步：奇度点个数只能是 0 或 2，并据此选起点
    if (odd.size() != 0 && odd.size() != 2) {   // [start] check odd_deg_cnt
        puts("NO");
        return 0;
    }
    int start = odd.empty() ? first : odd[0];  // [end] check odd_deg_cnt

    //第 4 步：Hierholzer，沿未使用边前进，无路可走就弹栈收路
    vector<int> stack_path, path;
    stack_path.push_back(start);
    while (!stack_path.empty()) {
        int u = stack_path.back();
        while (ptr[u] < (int)g[u].size() && used[g[u][ptr[u]].second]) // [start] hierholzer step
            ptr[u]++;
        if (ptr[u] == (int)g[u].size()) {
            //u 没有未使用边了，把它收进答案   // [start] hierholzer pop
            path.push_back(u);
            stack_path.pop_back();
            // [end] hierholzer pop
        }
        else {
            auto [v, id] = g[u][ptr[u]++];     //取一条未使用边，压栈走过去
            used[id] = 1;
            stack_path.push_back(v);
        }
    }                                          // [end] hierholzer step

    //第 5 步：path 是后序产生的，反转一次才是欧拉路  // [start] reverse path
    if ((int)path.size() != m + 1) {
        puts("NO");
        return 0;
    }
    reverse(path.begin(), path.end());
    for (int i = 0; i < (int)path.size(); i++)
        printf("%d%c", path[i], " \n"[i + 1 == (int)path.size()]);
    // [end] reverse path

    return 0;
}
