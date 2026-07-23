const start_point = /\/\/\s*\[start\]\s*(.*)$/
const end_point = /\/\/\s*\[end\]\s*(.*)$/
const start_end_point = /\/\/\s*\[start\s+end\]\s*(.*)$/
//读取代码,分析代码的跳转

export type pointJumpType = {
    [key: string]: [number,number]
}

function str_hash(str: string) {
    return str
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    //把hash转成hex string
    let hex = (hash >>> 0).toString(16);
    while (hex.length < 8) {
        hex = '0' + hex;
    }
    return hex;
}

export function read_raw_code(code: string) {
    let code_split = code.split('\n')
    console.log(code_split.length)
    let __raw_code = []
    let point_jump_info : pointJumpType = {}
    for(let i = 0;i<code_split.length;i++) {
        let line = code_split[i].trimEnd()
        if( start_point.test(line) ) {
            let res = start_point.exec(line)
            let hash = str_hash(res![1])
            point_jump_info[hash] = [i,0]
            __raw_code.push(line.replace(start_point,''))
        }
        else if( end_point.test(line) ) {
            let res = end_point.exec(line)
            let hash = str_hash(res![1])
            if( point_jump_info[hash] ) 
                point_jump_info[hash][1] = i
            __raw_code.push(line.replace(end_point,''))
        }
        else if( start_end_point.test(line) ) {
            let res = start_end_point.exec(line)
            let hash = str_hash(res![1])
            point_jump_info[hash] = [i,i]
            __raw_code.push(line.replace(start_end_point,''))
        }
        else __raw_code.push(code_split[i])
    }
    return {
        point_jump_info,
        code: __raw_code.join('\n')
    }
}

// let code = 
// `//Author by [Rainboy](https://github.com/rainboylvx) 
// //date: 2024-11-19 19:24:17
// #include <bits/stdc++.h>
// using namespace std;
// typedef long long ll;
// const int maxn = 1e6+5;
// const int maxe = 1e6+5;

// int n,m;
// int deg[maxn]; //每个点的度 

// //图的存储结构,linkList
// struct linkList {
//     typedef struct {int u,v,w,next;
//         int pre; //比这条边新的同起点的边的编号,这里是一个前驱,一个双向的链表
//     } edge;
//     edge e[maxe];
//     int h[maxn],edge_cnt=0;
//     linkList(){
//         edge_cnt=0;
//         memset(h,-1,sizeof(h));
//     }

//     //遍历点u 周围点
//     template<typename U>
//     void for_each(int u,U func){
//         for(int i = h[u] ; i !=-1;i = e[i].next)
//             func(e[i].u,e[i].v,e[i].w); //u v w
//     }

//     void add(int u,int v,int w=0){
//         e[edge_cnt] = {u,v,w,h[u]}; //创建了一条新的边
//         e[edge_cnt].pre = -1; //最新的这条边没有前驱
//         e[h[u]].pre = edge_cnt; //前驱是这条边
//         h[u] = edge_cnt++;
//     }
//     void add2(int u,int v,int w=0){
//         add(u,v,w);
//         add(v,u,w);
//     }
//     //下标访问
//     edge& operator[](int i){ return e[i]; }
//     //返回head[u]
//     int operator()(int u){ return h[u]; }

//     // linkList的外挂,结构,用来删除一边
//     //corresponding edge 表示对应的那条边
//     //传入 idx(边的编号),返回对应的边的
//     int corres_edge(int idx){
//         return idx^1; //异或运算
//     }

//     //删除一条边
//     void del_edge(int idx){
//         int p = e[idx].pre; //当前边的前驱
//         int nxt = e[idx].next; //当前边的后继
//         if( p != -1)
//             e[p].next = nxt; //前驱的next指向后继
//         else { //这是第一条边,要修改head
//             int u = e[idx].u;
//             h[u] = nxt;
//         }
//         if( nxt != -1)
//             e[nxt].pre = p; //后继的前驱指向前驱
//     }

//     void del_edge2(int idx) {
//         del_edge(idx);
//         del_edge( corres_edge(idx) );
//     }
// } e;

// // 桶
// bool iscut[maxe]; //记录边是否是桥


// //读取数据
// void init() {
//     cin >>n >> m; //读取n个结点, m条边
//     for(int i =1;i<=m;i++) {
//         int u,v;
//         cin >> u >> v;
//         deg[u]++,deg[v]++; //度加1 
//         e.add2(u,v);
//     }
// }

// //从u开始进行bfs
// int dfn[maxn],low[maxn];
// int time_cnt;
// bool vis[maxn];
// void tarjan_cut_edge(int u,int fa) { // [start] tarjan_cut_edge
//     vis[u] = 1;
//     low[u] = dfn[u] = ++time_cnt;

//     for(int i = e.h[u];i != -1;i = e[i].next) {
//         int v = e[i].v;
//         if( !vis[v] ) {
//             tarjan_cut_edge(v,u);
//             low[u] = min(low[u],low[v]);
//             if( low[v] > dfn[u] ) {
//                 iscut[i] = iscut[i^1] = 1; //设为桥
//             }
//         }
//         else if( v != fa ) { //返祖边
//             low[u] = min(low[u],dfn[v]);
//         }
//     }
//     cout << u << " ";
//     cout << dfn[u] << " " << low[u] << endl;
// } // [end] tarjan_cut_edge

// //进行fleury算法,求 欧拉迹

// //从u开始找下一个点,优先走非桥
// // 返回下一条可以走的边的编号
// int fleury_find_next(int u) {
//     for (int i = e(u); i != -1; i = e[i].next)
//     {
//         if (iscut[i]) continue; // 跳过桥
//         return i;
//     }
//     // 没有找到非桥,走桥
//     return e(u);
// }
// void fleury() {
//     int odd_deg_cnt = 0;


//     int u = 0; // 0 表示没有找到起始点
//     for(int i = 1;i<=n;i++){ // [start] find start point
//         if( deg[i] % 2 == 1 ) {
//             if( u == 0) u = i; //记录从一个 奇度点开始
//             odd_deg_cnt++;
//         }
//     } // [end] find start point
//     // 奇度结点大于2,无欧拉迹
//     if( odd_deg_cnt > 2 ) {  // [start] check odd_deg_cnt
//         cout << "no euler path" << endl;
//         return ;
//     } // [end] check odd_deg_cnt

    
//     //当u的度不为0,也就是u不是孤立点
//     while( deg[u] ) {
//         int edge_idx  = fleury_find_next(u); //优先走非桥  [start end] fleury_find_next
//         int v = e[edge_idx].v; // [start] deal with edge
//         e.del_edge2(edge_idx); // 删除边
//         cout << u << " " << v << endl;
//         deg[u]--, deg[v]--; // 度减1
//         u = v;              // 更新u //[end] deal with edge
//     }
// }

// int main () {
//     std::ios::sync_with_stdio(false); cin.tie(0); cout.tie(0); // 关闭io同步
//     init();
//     tarjan_cut_edge(1,0);
// #ifdef DEBUG
//     // 输出m条边
//     for(int i = 0 ;i< m*2;i+=2) {
//         cout << "edge: " << i <<"  is cut edge : ";
//         cout << iscut[i] << "  ";
//         if( iscut[i] ) {
//             cout << "cut edge : (";
//             cout << e[i].u << "," << e[i].v << ")" ;
//         }
//         cout <<endl;
//     }
// #endif
//     fleury();
//     return 0;
// }`
// console.log(read_raw_code(code))

// export const x = read_raw_code