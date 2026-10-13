#include <algorithm>
#include <iostream>
using namespace std;
const long long INF = (1LL << 60);
long long dp[9][9];
int main() {
    int n, m; cin >> n >> m;
    for (int i = 1; i <= n; ++i)
        for (int j = 1; j <= n; ++j)
            dp[i][j] = (i == j ? 0 : INF); // [start end] initial
    while (m--) {
        int u, v; long long w; cin >> u >> v >> w;
        dp[u][v] = min(dp[u][v], w);
    }
    // k 必须在最外层；无负环时 dp[k][k] = 0，来源行和列不会被本轮改小。
    for (int k = 1; k <= n; ++k)
        for (int i = 1; i <= n; ++i)
            for (int j = 1; j <= n; ++j) {
                if (dp[i][k] != INF && dp[k][j] != INF) { // [start] compare
                    long long via = dp[i][k] + dp[k][j]; // [end] compare
                    dp[i][j] = min(dp[i][j], via); // [start end] result
                }
            }
    for (int i = 1; i <= n; ++i)
        if (dp[i][i] < 0) { cout << "Negative cycle\n"; return 0; }
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= n; ++j)
            if (dp[i][j] == INF) cout << "INF ";
            else cout << dp[i][j] << ' ';
        cout << '\n';
    }
}
