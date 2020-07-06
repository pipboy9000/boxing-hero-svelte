import {
    writable
} from 'svelte/store';

export const hitTarget = writable(localStorage.getItem("hitTarget") || 15);

// export const topScoreNormal = writable(localStorage.getItem("topScoreNormal") || 0);
// export const topScoreFreestle = writable(localStorage.getItem("topScoreFreestle") || 0);
// export const topScoreReaction = writable(localStorage.getItem("topScoreReaction") || 0);

hitTarget.subscribe(value => {
    localStorage.setItem("hitTarget", value);
})

// topScoreNormal.subscribe(value => {
//     localStorage.setItem("topScoreNormal", value);
// })

// topScoreFreestle.subscribe(value => {
//     localStorage.setItem("topScoreFreestle", value);
// })

// hitTarget.subscribe(value => {
//     localStorage.setItem("topScoreReaction", value);
// })