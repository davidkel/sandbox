'use strict'



async function doSomething()  {
    return new Promise((resolve, reject) => {
        let t = 0;
        for (let i = 1; i < 10000000000; i++) {
            t = t + 1;
        }
        //throw new Error(t);
        reject(new Error(t));
    })
};

(async () => {
    try {
        await doSomething();
        //console.log('waiting');
        //setTimeout(() => {
        //    console.log('timeout')
        //}, 5000);
    } catch (error) {
        console.log('got error', error);
    }
})();
