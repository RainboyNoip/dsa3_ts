
<script lang="ts">
import { defineComponent } from 'vue'

// components
import Splite_layout_unocss from "../../src/components/splite_layout_unocss.vue"
import {NButton,NButtonGroup,NProgress,NSelect,NFlex } from 'naive-ui'
import codeEditor from "@/components/code-editor.vue";

import default_graph_data from './input_data/data.json'
const default_graph_selector_options = default_graph_data.map((item,i) => ({label: item.name, value: i}))


import { Icon } from '@iconify/vue';
import {read_raw_code} from '@/lib/read_raw_code'


import {Graph,GraphType} from '../../src/lib/graph_ts'
import {Core,NodeDefinition,EdgeDefinition} from 'cytoscape'

import raw_code  from './code.cpp?raw'
const {code ,point_jump_info} = read_raw_code(raw_code)


var CY:Core = null as any
import {Dfsscc} from './dfsscc'
import { initCytoscape } from './cyto';

export default defineComponent({
    name:'dfsscc',
    components: { Splite_layout_unocss, NButton, NButtonGroup, NProgress, NSelect, NFlex, codeEditor, Icon},
    data () {
        return {
            default_graph_selector_value: 0 as number,
            default_graph_selector_options : default_graph_selector_options,

            code:code,

            now_frame: 0 as number,

            cy:null as HTMLElement | null,
            jump_line:[-1,-1],
            log:'', 

            graph: new Graph(GraphType.digraph) as Graph,
            dfsscc: new Dfsscc( new Graph(GraphType.digraph), point_jump_info),

        }
    },
    mounted() {
        console.log('mounted')
        this.cy = this.$refs.cy as HTMLElement
        this.init_graph(default_graph_data[this.default_graph_selector_value].nodes,default_graph_data[this.default_graph_selector_value].edges)
    },
    watch: {
        default_graph_selector_value(new_value,old_value) { // console.log(this.default_graph_selector_value)
          if( new_value != old_value) {

            this.init_graph(default_graph_data[new_value].nodes,default_graph_data[new_value].edges)
            this.now_frame = 0
          }
        },
        now_frame(new_value,old_value) {
            if( new_value != old_value) {
                let frame = this.dfsscc.get_frame(new_value)
                this.remove_cy_all_class();
                //设定所有的边
                for (let edge of frame.edges_state) {
                    CY.edges(`[source = "${edge.source}"][target = "${edge.target}"]`).addClass(edge.class.join(' '))
                }

                //设定所有的点
                for (let node of frame.nodes_state) {
                    CY.nodes(`[id = "${node.id}"]`).addClass(node.class.join(' '))
                    if( node.color ) {
                        console.log('node.color',node.color)
                        CY.nodes(`[id = "${node.id}"]`).data('color',node.color)
                    }
                }
                //设置跳转线
                this.jump_line = [...frame.jump]
                this.log = frame.log
                console.log(frame)
            }
        }
    },
    methods :{
      remove_cy_all_class() {
        let allClasses: Set<string> = new Set();
        CY.elements().forEach(function (element) {
          element.classes().forEach(function (className) {
            allClasses.add(className);
          });
        });
        CY.elements().removeClass(Array.from(allClasses).join(' '));
        // 删除边上的dfn值
        CY.edges().removeData('dfn')
      },
        get_input_data() {
          alert('TODO')
        },
        play_pre() {
            if( this.now_frame > 0) {
                this.now_frame -= 1
            }
        },
        play_next() {
            if( this.now_frame < this.frame_cnt) {
                this.now_frame += 1
            }
        },
        init_graph(nodes:NodeDefinition[],edges:EdgeDefinition[]) {
            if( CY) {
                CY.destroy()
            }
            CY = initCytoscape(this.cy as HTMLElement,nodes,edges)
            this.graph = new Graph(GraphType.digraph)
            this.graph.readFromCytoscape(nodes,edges)
            this.log = ''
            this.now_frame = 0
            this.jump_line = [-1,-1]
            this.dfsscc = new Dfsscc(this.graph as Graph,point_jump_info);
            this.dfsscc.run_dfsscc();
        }
    },
    computed : {
        frame_cnt() {
            return this.dfsscc.frame_cnt
        },
        color_list() {
            return this.dfsscc.get_frame(this.now_frame).color
        },
        node_ids() {
            return this.dfsscc.get_frame(this.now_frame).node_ids
        },
        stack_list() {
            return this.dfsscc.get_frame(this.now_frame).stack
        },
        dfn_list() {
            return this.dfsscc.get_frame(this.now_frame).dfn
        },
        low_list() {
            return this.dfsscc.get_frame(this.now_frame).low
        }
    }
})
</script>

<template>
    <div class="container mx-auto py-2 box-border h-full">
        <Splite_layout_unocss>
            <template v-slot:top>
                <div class="flex justify-center items-center gap-3">
                    <n-button-group>
                        <n-button @click="play_pre">
                            <Icon icon="fluent:previous-16-regular" width="15" height="15" />
                        </n-button>
                        <n-button ghost @click="play_next">
                            <Icon icon="fluent:next-16-regular" width="15" height="15" />
                        </n-button>
                    </n-button-group>
                    <n-progress type="line" :percentage="now_frame/(frame_cnt || 1) * 100">
                        {{ now_frame}}/ {{ frame_cnt }}
                    </n-progress>
                </div>
            </template>

            <template v-slot:left>
                <div class="flex flex-col h-full relative">
                    <div class="card-1 p-2 grow-0">
                        <n-flex>
                            <n-select v-model:value="default_graph_selector_value"
                                :options="default_graph_selector_options" style="width: 200px;"></n-select>
                            <n-button @click="get_input_data">输入数据</n-button>
                        </n-flex>
                        <div class="">
                            <table>
                                <thead>
                                    <tr>
                                        <th>编号</th>
                                        <th v-for="node in node_ids" :key="node">{{ node }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>color</td>
                                        <th v-for="(item,idx) in color_list" :key="node_ids[idx]">{{ item}}</th>
                                    </tr>
                                    <tr>
                                        <td>dfn</td>
                                        <th v-for="(item,idx) in dfn_list" :key="node_ids[idx]">{{ item}}</th>
                                    </tr>
                                    <tr>
                                        <td>low</td>
                                        <th v-for="(item,idx) in low_list" :key="node_ids[idx]">{{ item}}</th>
                                    </tr>
                                </tbody>
                            </table>

                        </div>
                        <div class="m-1 mt-3">
                            {{ log }}
                        </div>
                    </div>
                    <div class="card-1 absolute top-80 right-5 p-2 z-1000 bg-blueGray-100 bg-op-80" style="">
                        <h3 class="my-2 text-center">栈</h3>
                        <div class="flex flex-col flex-col-reverse">
                            <span v-for="item in stack_list" :key="item" class="border-1 border-solid border-gray-500 rounded px-5">{{ item }}</span>
                        </div>
                    </div>
                    <div id="cy" class="grow" style="" ref="cy"></div>
                </div>
            </template>

            <template v-slot:right>
                <code-editor :code="code" :hline_start="jump_line[0]" :hline_end="jump_line[1]"></code-editor>
            </template>
        </Splite_layout_unocss>
    </div>
</template>

<style>
html,body {
  padding: 0;
  margin: 0;
  height: 100vh;
  width: 100vw;
  /* overflow: hidden; */
}
</style>
