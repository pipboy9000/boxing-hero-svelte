import {
    writable
} from 'svelte/store';



export const hitTarget = writable(localStorage.getItem("hitTarget") || 10);

hitTarget.subscribe(value => {
    localStorage.setItem("hitTarget", value);
})