<script setup lang="ts">
</script>

<template>
    <div class="h-full">
        <div class="flex h-full flex-col">
            <div class="mb-1 p-3 card-1 grow-0"> 
                <slot name="top"></slot>
            </div>
            <div class="grid grid-cols-2 gap-1 grow">
                <div class="card-1">
                    <slot name="left"></slot>
                </div>
                <div class="card-1">
                    <slot name="right"></slot>
                </div>
            </div>
            <div class="grow-0"> 
                <slot name="footer"></slot>
            </div>
        </div>
    </div>
</template>

<style></style>