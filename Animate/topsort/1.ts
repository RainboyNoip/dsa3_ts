class g {
    private a: number;
    constructor() {
        this.a = 1;
    }

    print() {
        console.log(this.a);
    }
}

class b {
    private g: g;
    constructor() {
        this.g = new g();
    }

    set_g(g: g) {
        this.g = g;
    }

    get_g() {
        return this.g;
    }
    
}

let b1 = new b();
b1.set_g(new g()); //为什么是这里提示我有 TS2345
// b1.g.print();