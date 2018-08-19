class Observer{
    constructor(data){
    //    debugger;
        this.observer(data);
    }
    observer(data){
        //将这个数据将原有的属性 改成set和get的形式
        if(!data || typeof data !== 'object'){
            return;
        };
        //debugger;
        //要将数据一一劫持 先获取data的key和value;
        Object.keys(data).forEach(key=>{
            //劫持
            this.defineReactive(data,key,data[key]);
            this.observer(data[key]);//深度劫持
        });

    }
    //定义响应式
    defineReactive(obj,key,value){
        let that = this;
        let dep = new Dep();//每个变化的数据都会对应一个数据
        //这个数据是存放所有更新的操作
        Object.defineProperty(obj,key,{
            enumerable:true,
            configurable:true,
            get(){ //当取值的时候调用该方法
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set(newValue){//当data属性中设置值的时候 更改获取的属性的值
                if(newValue!=value){
                    //这里的this不是实例 vm.message
                    that.observer(newValue); //如果是对象继续解析
                    value = newValue;
                    dep.notify();//通知所有人数据更新了
                }
            }
        })
    }
}
class Dep{
    constructor(){
        //订阅的数组
        this.subs = []
    }
    addSub(watcher){
        this.subs.push(watcher);
    }
    notify(){
        this.subs.forEach(watcher=>watcher.update());
    }
}