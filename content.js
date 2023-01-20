const promptBoxQuery = '.text-sm.relative.font-medium.rounded-lg.overflow-auto'
const promptTitleQuery = '.overflow-x-auto.relative.hide-scrollbar.border-b.flex'

const buttonQuery = '.sc-kgTSHT.cFBAZz.MuiButtonBase-root.px-4.py-1.relative.no-underline.font-light.opacity-40'

const urlQuery = 'a.underline.flex.items-center.truncate'

const MODELS = { "Anything V3.0": '6569e224',"anything-v3.0": '6569e224', 'Anime': '925997e9', 'anime': '925997e9', 'anything-v4.5': 'fbcf965a62', 'counterfeit-v2.0': '8838e0d1fb' }

const getArtId = () => {
    const targetElement = document.querySelector(urlQuery);
    if (!targetElement) { return; }
    return targetElement.text.slice(26);
}

const parseParams = (detailParams, params) => {
    const prompt = detailParams.prompt
    const negative_prompt = detailParams.negative_prompt
    const steps = detailParams.steps
    const sampler = detailParams.sampler
    const cfg_scale = detailParams.cfg_scale
    const seed = detailParams.seed
    const height = detailParams.height
    const width = detailParams.width
    const model = params.model
    // const operation = detailParams.operation

    // if (operation == "i2i") {
    //     return ''
    // }

    const model_hash = MODELS[model]
    const clip_skip = '2'
    const ENSD = '31337'

    const infoText = `${prompt}\nNegative prompt: ${negative_prompt}\nSteps: ${steps}, Sampler: ${sampler}, CFG scale: ${cfg_scale}, Seed: ${seed}, Size: ${width}x${height}, Model hash: ${model_hash}, Clip skip: ${clip_skip}, ENSD: ${ENSD}`;
    return infoText;
}


const parseRes = (res) => {
    const artwork  = res.data.artwork
    if (!artwork) { console.log("No artwork associated"); return artwork; }
    const task = artwork.task
    if (!task) { console.log("No task associated"); return task; }
    const params = task.outputs.detailParameters
    const promptText = params.infotexts
    if (!promptText) { return parseParams(params, task.parameters) }
    return promptText;

}

const getPrompt = async (artId) => {
    res = await fetch("https://api.pixai.art/graphql", {
        "headers": {
            "content-type": "application/json",
        },
        "body": `{\"query\":\"\\n    query getTaskOfArtwork($artworkId: ID!) {\\n  artwork(id: $artworkId) {\\n    task {\\n      ...TaskBase\\n    }\\n  }\\n}\\n    \\n    fragment TaskBase on Task {\\n  id\\n  userId\\n  parameters\\n  outputs\\n  artworkId\\n  status\\n  priority\\n  runnerId\\n  startedAt\\n  endAt\\n  createdAt\\n  updatedAt\\n  media {\\n    ...MediaBase\\n  }\\n  type {\\n    type\\n    model\\n  }\\n}\\n    \\n\\n    fragment MediaBase on Media {\\n  id\\n  type\\n  width\\n  height\\n  urls {\\n    variant\\n    url\\n  }\\n  imageType\\n  fileUrl\\n  duration\\n  thumbnailUrl\\n  hlsUrl\\n  size\\n}\\n    \",\"variables\":{\"artworkId\":\"${artId}\"}}`,
        "method": "POST"
    });
    return parseRes(await res.json())
}

const copyToClipboard = async (text) => {
    if (!navigator.clipboard) {
        console.error('Browser does not support Copy to Clipboard')
        return false;
    }
    let status = false
    navigator.clipboard.writeText(text).then(function () {
        console.log('Async: Copying to clipboard was successful!');
        status = true;
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
    return status;
}

const addIcon = async (promptText = '') => {
    // Find the element on the page where you want to add the text
    // const targetElement = document.querySelector(promptTitleQuery);
    const targetElement = document.querySelector(buttonQuery).parentElement;

    if (!targetElement) {
        console.error("promptTitle not found");
        return;
    }

    // Create Icon
    const infoIcon = document.createElement('div');
    infoIcon.innerHTML = '<svg class="sc-ipEyDJ ewkAmK MuiSvgIcon-root MuiSvgIcon-fontSizeMedium" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ContentCopyIcon"><path d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z"/></svg>';
    infoIcon.className = 'prompt-info';

    const copyIcon = document.createElement('div');
    copyIcon.innerHTML = `<svg class="sc-ipEyDJ ewkAmK MuiSvgIcon-root MuiSvgIcon-fontSizeMedium" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ContentCopyIcon"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>`;
    copyIcon.className = 'prompt-copy';

    const tooltip = document.createElement('div');
    tooltip.innerHTML = 'Copied'
    tooltip.className = 'prompt-copy-tooltip'

    if (!promptText) {
        infoIcon.style.color = 'red';
        copyIcon.style.color = 'red';
    }

    if (promptText) {// Toggle on click
        infoIcon.style.cursor = 'pointer';
        copyIcon.style.cursor = 'pointer';
        const promptBox = document.querySelector(promptBoxQuery);
        if (!promptBox) {console.error('promptBox not found'); return}
        const existing = promptBox.innerHTML;
        let showInfo = false;



        infoIcon.onclick = () => {
            if (showInfo) {
                promptBox.innerHTML = existing;
                infoIcon.style.color = 'inherit';
                showInfo = false;
                return;
            }
            promptBox.innerHTML = promptText;
            infoIcon.style.color = 'blue';
            showInfo = true;
        }
        copyIcon.onclick = async () => {
            if (copyToClipboard(promptText)) {
                copyIcon.style.color = 'blue';
                tooltip.style.opacity = '1';
                tooltip.style.color = 'blue';
                setTimeout(() => {
                    copyIcon.style.color = 'inherit';
                    tooltip.style.opacity = '0';
                    tooltip.style.color = 'inherit';
                }, 1000);
            }
        }
    }


    targetElement.appendChild(tooltip);
    targetElement.appendChild(copyIcon);
    targetElement.appendChild(infoIcon);
    // targetElement.insertBefore(tooltip, targetElement.firstChild);
    // targetElement.insertBefore(copyIcon, targetElement.firstChild);
    // targetElement.insertBefore(infoIcon, targetElement.firstChild);
}

main = async () => {
    artId = getArtId()
    promptText = await getPrompt(artId)
    console.log(promptText)
    // Fetch prompts
    // Display icon with prompt
    const examplePrompts = `masterpiece, best quality, {realistic}, {{{masterpiece}}}, {{highest quality}}, {absurdres}, dynamic action, solo female, captivating, happy to see you, original, doodle, {{dynamic lighting}}, dynamic angle, low angle, Beautifully lit, cinematic shot, close up, macrophotography, bokeh f4. Mature female, elf, dark skin (2.5), mocha skin, perfect proportions, toned tummy, midriff, heavenly thighs. Soft lips, soft smile, blushing, adoring expression. Elegant raven black hair, elven braid, shimmering hair, floating hair. Honey eyes, loving eyes, intricately-detailed eyes. Flat colors. Sparkling red sash with gold ribbons, translucent. Autumn forest, lense flare, floating orange leaves.
    Negative prompt: lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry
    Steps: 28, Sampler: Euler a, CFG scale: 11, Seed: 58300117, Size: 512x768, Model hash: 6569e224, Clip skip: 2, ENSD: 31337`
    addIcon(promptText)
}


if (window.location.href.includes('.art/artwork')) {
    setTimeout(main, 1000)
} else {
    // Select the node that will be observed for mutations
    const targetNode = document.getElementById('root');

    // Options for the observer (which mutations to observe)
    const config = { attributes: true };

    // Callback function to execute when mutations are observed
    const callback = (mutationList, observer) => {
        if (targetNode.getAttribute('aria-hidden')) {
            setTimeout(main, 500)
        }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
}