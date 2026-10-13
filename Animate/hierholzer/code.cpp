#include <bits/stdc++.h>
using namespace std;

// 无向图欧拉路 / 欧拉回路竞赛精简版（Hierholzer，不用 struct）
// 输入 n m 与 m 条边，输出一条欧拉路的顶点序列，无解输出 NO
// 判定：奇度点只能有 0 个（回路）或 2 个（路，从奇点出发）
// 连通性不用单独判：走不完所有边（path 长度 != m+1）就是不连通
// 口诀：走不动了再记点，记完 reverse

int n, m;
vector<vector<pair<int, int>>> g; // 邻接表 {终点, 边编号}
vector<int> deg, used, cur, path; // used: 边已走；cur: 当前弧

void hierholzer(int s) {
    vector<int> st = {s};
    while (!st.empty()) {
        int u = st.back();
        // 跳过已走的边；cur 保证每条边只被扫过常数次，总复杂度 O(n+m)  // [start] hierholzer step
        while (cur[u] < (int)g[u].size() && used[g[u][cur[u]].second]) cur[u]++;
        if (cur[u] == (int)g[u].size()) {
            path.push_back(u); // 走不动才记点（后序），reverse 后才是答案  // [start] hierholzer pop
            st.pop_back();
            // [end] hierholzer pop
        } else {
            auto e = g[u][cur[u]++]; // 用掉这条边，走向下一点
            used[e.second] = 1;
            st.push_back(e.first);
        }
    }                                          // [end] hierholzer step
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    g.assign(n + 1, {});
    deg.assign(n + 1, 0);
    used.assign(m + 1, 0);
    cur.assign(n + 1, 0);
    for (int id = 1; id <= m; id++) {          // [start] read graph
        int u, v;
        cin >> u >> v;
        g[u].push_back({v, id});
        g[v].push_back({u, id}); // 两个方向共用编号，不会来回走同一条边
        deg[u] += (u == v ? 2 : 1); // 易错点：自环度数 +2
        if (u != v) deg[v]++;
    }                                          // [end] read graph

    int s = -1, odd = 0;
    for (int i = 1; i <= n; i++) {             // [start] check odd_deg_cnt
        if (deg[i] % 2) odd++, s = i; // 奇点只可能是端点，s 取最后一个奇点
    }
    if (odd != 0 && odd != 2) {
        cout << "NO\n";
        return 0;
    }                                          // [end] check odd_deg_cnt
    if (s == -1) {                             // [start] find start point
        for (int i = 1; i <= n; i++)           // 全偶度是回路，任取一个有边的点出发
            if (deg[i]) { s = i; break; }
    }
    if (s == -1) { // 边界：没有任何边，欧拉路是空序列
        cout << '\n';
        return 0;
    }                                          // [end] find start point

    hierholzer(s);
    if ((int)path.size() != m + 1) {           // [start] check path size
        cout << "NO\n"; // 边没走完，说明有边的点不连通
        return 0;
    }                                          // [end] check path size
    reverse(path.begin(), path.end());         // [start] reverse path
    for (int i = 0; i < (int)path.size(); i++) cout << path[i] << " \n"[i + 1 == (int)path.size()];
    // [end] reverse path
    return 0;
}
