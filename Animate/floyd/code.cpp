#include <algorithm>
#include <iostream>
using namespace std;
const long long INF = (1LL << 60);
long long dp[9][9][9];
int main() {
    int n, m; cin >> n >> m;
    for (int i = 1; i <= n; ++i)
        for (int j = 1; j <= n; ++j)
            dp[i][j][0] = (i == j ? 0 : INF); // [start end] initial
    while (m--) {
        int u, v; long long w; cin >> u >> v >> w;
        dp[u][v][0] = min(dp[u][v][0], w);
    }
    for (int k = 1; k <= n; ++k)
        for (int i = 1; i <= n; ++i)
            for (int j = 1; j <= n; ++j) {
                dp[i][j][k] = dp[i][j][k-1];
                if (dp[i][k][k-1] != INF && dp[k][j][k-1] != INF) { // [start] compare
                    long long via = dp[i][k][k-1] + dp[k][j][k-1]; // [end] compare
                    dp[i][j][k] = min(dp[i][j][k], via); // [start end] result
                }
            }
    for (int i = 1; i <= n; ++i)
        if (dp[i][i][n] < 0) { cout << "Negative cycle\n"; return 0; }
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= n; ++j)
            if (dp[i][j][n] == INF) cout << "INF ";
            else cout << dp[i][j][n] << ' ';
        cout << '\n';
    }
}
