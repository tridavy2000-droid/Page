let x_currentDate = new Date();
x_currentDate.setHours(x_currentDate.getHours() + 24);






localStorage.getItem('x_currentDate') ?? localStorage.setItem('x_currentDate', x_currentDate.getTime());
if (localStorage.getItem('x_currentDate') && localStorage.getItem('x_currentDate') < Date.now()) {
    localStorage.clear()
}


const regex = /^\{.*\}$/;
const regex2 = /^%7B.*%7D$/;


for (const [key, value] of Array.from(x_parametr.entries())) {

    const decodedValue = decodeURIComponent(value);

    if (regex.test(decodedValue) || regex2.test(encodeURIComponent(decodedValue)) || !decodedValue) {
        x_parametr.delete(key);
    }
}

if (x_parametr.has('_token')) {
    x_parametr.delete('_token')
}


let x_uraParams = '';

let xurlsearchParams = new URLSearchParams(location.search);
x_parametr.has('fbclid') && x_parametr.get('fbclid') ? x_uraParams += `&fbclid=${x_parametr.get('fbclid')}` : x_uraParams += '';
x_parametr.has('fbtoken') && x_parametr.get('fbtoken') ? x_uraParams += `&tokenfb=yes` : x_uraParams += '&tokenfb=no';
xurlsearchParams.has('xevent') && xurlsearchParams.get('xevent') ? x_uraParams += `&xevent=${xurlsearchParams.get('xevent')}` : x_uraParams += ''
console.log(x_uraParams)


document.querySelectorAll(`${x_scrollItem}`).forEach((el) => {
    el.onclick = (e) => {
        e.preventDefault()
        // document.querySelector(`${x_scrollblock}`).scrollIntoView({behavior: "smooth", block: "center"})

        window.scrollTo({
            behavior: "smooth",
            top: document.querySelector(`${x_scrollblock}`).getBoundingClientRect().top + window.scrollY
        })
    }
})


const updatedQueryString = x_parametr.toString();
console.log(updatedQueryString);

let mess = 'Compruebe si el nР вЂњРЎвЂќmero de telР вЂњР’В©fono estР вЂњР Р‹ introducido correctamente. Si el nР вЂњРЎвЂќmero se ingresР вЂњРЎвЂ“ correctamente, actualice la pР вЂњР Р‹gina y vuelva a intentarlo.'


const LAZY = document.querySelectorAll('img');
for (let i = 0; i < LAZY.length; i++) {
    LAZY[i].setAttribute('loading', 'lazy');
}


function isResultOk(result) {
    return result.status === 'ok' ||
        result.status === 'success' ||
        result.id ||
        result.OK ||
        result.uuid ||
        (result.api && result.api.success === true) ||
        result.result === 'ok' ||
        result.message === 'OK' ||
        result.success === true ||
        (result.data && result.data.success === true) ||
        (result.result && result.result.success === true) ||
        result.code === 200 ||
        result.code === 'ok' ||
        result === 'Lead added successfully' ||
        result.ok === true ||
        result.type === 'success' ||
        (result.data && result.data.id) ||
        (result.data && result.data.result && result.data.result.id) ||
        (result.response && result.response.status === 'success');
}


if (x_parametr.has('fbpixel')) setCookie('pixel', x_parametr.get('fbpixel'), 24)


if (x_parametr.has('dm')) {
    domonetka(x_parametr.get('dm'))
} else {

    document.querySelectorAll('iframe').forEach((el) => {
        el.remove()
    })

}


let order = localStorage.getItem('order') ?? 0;

function x_strt() {
    document.querySelectorAll('form').forEach((el) => {
        console.log(el)
        let btn = el.querySelector('button') ?? el.querySelector('input[type=submit]');
        let phone = el.phone;
        let name = el.name;
        if (!btn || !phone || !name) {
            console.log(!btn ? 'no_btn' : !name ? 'no_name' : !phone ? 'no_phone' : '');
            return;
        }


        el.action = 'api.php';

        el.querySelectorAll('input[type="hidden"]').forEach((el) => {
            el.remove()
        })
        let subid = document.createElement('input');
        subid.value = getSubId();
        subid.name = 'sub1';
        subid.type = 'hidden';

        let utm_medium = document.createElement('input');
        utm_medium.value = x_parametr.get('xbaer') ?? x_parametr.get('utm_medium');
        utm_medium.name = 'sub2';
        utm_medium.type = 'hidden';

        if (x_parametr.has('xtoken')) {
            let xtoken = document.createElement('input');
            xtoken.value = x_parametr.get('xtoken');
            xtoken.name = 'xtoken';
            xtoken.type = 'hidden';
            el.insertAdjacentElement("afterbegin", xtoken);

        }

        el.insertAdjacentElement("afterbegin", subid);
        el.insertAdjacentElement("afterbegin", utm_medium);


        phone.setAttribute('maxLength', x_maxLength + x_country_code.length)

        btn.setAttribute('disabled', 'true');
        btn.style.opacity = '0.5';

        phone.oninput = function (e) {
            this.value = this.value.replace(/[^\d]/gi, '');
            if (!this.value.startsWith(x_country_code)) {
                this.value = x_country_code + this.value.slice(x_country_code.length - 1);
            }
            if (this.value.length >= x_country_code.length + x_minlength && this.value.length <= x_country_code.length + x_maxLength) {
                btn.style.opacity = '1'
                btn.removeAttribute('disabled')
            } else {
                btn.style.opacity = '0.5';
                btn.setAttribute('disabled', 'true')
            }
        }
        name.oninput = function (e) {
            this.value = this.value.replace(/[0-9+]/g, '');
        }

        phone.onclick = function (e) {
            if (!this.value.startsWith(x_country_code)) {
                this.value = x_country_code + this.value
            }
        }


        el.onsubmit = async function (e) {
            e.preventDefault();
            if (phone.value == localStorage.getItem('phone')) {
                await createPopup('The number you entered has already been used for the order.')
                return;
            }
            if (order == 2) {
                await createPopup('You have left the maximum number of orders.')
                return;
            }
            btn.style.opacity = '0.5';
            btn.setAttribute('disabled', true);


            try {
                let result = await fetch('api.php', {
                    method: 'POST',
                    body: new FormData(this)
                });

                if (!result.ok) {
                    throw new Error(mess)
                }

                result = await result.json();
                console.log(result)
                if (isResultOk(result)) {
                    order++;
                    localStorage.setItem('order', order)
                    localStorage.setItem('phone', phone.value);
                    localStorage.setItem('name', name.value);
                    const redirectUrl = typeof success !== 'undefined' ? success : '';

                    if (x_parametr.has('xlang') && !redirectUrl) {
                        const langValues = x_parametr.get('xlang').split(',');
                        const lang = langValues[0];
                        const gender = langValues[1];


                        if (lang && gender) {
                            location.href = `${location.protocol}//${location.host}/lander/success/index.php?lang=${lang}&gender=${gender}${x_uraParams}`;
                        } else if (lang) {
                            location.href = `${location.protocol}//${location.host}/lander/success/index.php?lang=${lang}${x_uraParams}`;
                        } else {
                            location.href = `${location.protocol}//${location.host}/lander/success/index.php?nolang=nolang${x_uraParams}`;
                        }
                    } else if (redirectUrl) {
                        location.href = redirectUrl;
                    } else {
                        location.href = `${location.protocol}//${location.host}/lander/success/index.php`;

                    }

                } else {
                    throw new Error(mess)
                }
            } catch (err) {
                console.log(err)
                await createPopup('Check if the phone number is entered correctly. If the number was entered correctly, refresh the page and try again.');
                btn.style.opacity = '1';
                btn.removeAttribute('disabled');
            }
        }
    })
}


(async function prestart() {
    x_strt()
})();


function domonetka(dom) {
    const dmPairs = dom.split(';').map(s => s.trim()).filter(Boolean);

    let [testpaircomID, testpairdam] = dmPairs[0].split(',').map(s => s.trim());

    if (!testpaircomID || !testpairdam) {
        console.log('ret')
        return;
    }




    if (x_parametr.has('utm_content')) {}x_parametr.delete('utm_content');
    if (x_parametr.has('ad_id')) x_parametr.delete('ad_id');
    x_parametr.delete('token');
    x_parametr.delete('offer');

    dmPairs.forEach((pair) => {
        const [comID, dam] = pair.split(',').map(s => s.trim());
        if (comID && dam) createFrame(comID, dam);
    });

    function createFrame(comID, dam) {
        x_parametr.set('dm', dam);

        const iframe = document.createElement('iframe');
        iframe.frameBorder = '0';
        iframe.dataset.iden = `${comID},${dam}`;

        Object.assign(iframe.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '100000000',
            display: 'none',
            backgroundColor: 'white',
            overflow: 'auto',
        });

        iframe.src = `${location.protocol}//${location.host}/${comID}?${x_parametr.toString()}`;
        document.body.insertAdjacentElement('afterbegin', iframe);
    }


    history.pushState('1', '', location.href); // убрать +1

    for (let i = 1; i <= dmPairs.length; i++) {
        console.log(i + 1);
        history.pushState(String(i+1), '', location.href);
    }

    window.onpopstate = function (event) {
        let dmPairsReverse = dmPairs.toReversed();
        console.log(dmPairsReverse);


        for (let i = 1; i <= dmPairsReverse.length; i++) {

            if (event.state === String(i)) {
                console.log('hrthtrth')
                document.querySelectorAll('[data-iden]').forEach(f => f.style.display = 'none');
                const iframe = document.querySelector(`[data-iden="${dmPairsReverse[i-1]}"]`);

                if (iframe) {
                    iframe.style.display = 'block';
                    document.body.style.overflow = 'hidden';

                }
            }
        }

    };
}


async function createPopup(text_popup) {
    let popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.zIndex = '10000000';
    popup.style.width = '100%';
    popup.style.height = '100%';
    popup.style.top = '0';
    popup.style.left = '0';
    popup.style.backgroundColor = 'rgba(0,0,0,0.44)';
    popup.style.display = 'flex';
    popup.style.transition = '.3s';
    popup.style.opacity = '0';

    let popup_main = document.createElement('div');
    popup_main.style.margin = 'auto';
    popup_main.style.maxWidth = '500px';
    popup_main.style.width = '90%';
    popup_main.style.boxSizing = 'border-box';
    popup_main.style.backgroundColor = 'white';
    popup_main.style.borderRadius = '20px';
    popup_main.style.padding = '40px 20px';

    let popup_main_h1 = document.createElement('h1');

    popup_main_h1.style.color = 'black';
    popup_main_h1.style.textAlign = 'center';
    popup_main_h1.textContent = text_popup;

    // width: 90%; background: black; color: white; padding: 10px 20px;border: 0; border-radius: 10px; display: block; margin: auto

    let popup_main_btn = document.createElement('button');
    popup_main_btn.style.width = '90%';
    popup_main_btn.style.display = 'block';
    popup_main_btn.style.background = 'black';
    popup_main_btn.style.color = 'white';
    popup_main_btn.style.padding = '10px 20px';
    popup_main_btn.style.border = '0';
    popup_main_btn.style.borderRadius = '10px';
    popup_main_btn.style.margin = ' 20px auto';
    popup_main_btn.textContent = 'OK';
    popup_main_btn.onclick = async (e) => {
        popup.style.opacity = '0';
        await new Promise((resolve) => {
            popup.addEventListener('transitionend', function handleTransitionEnd(e) {
                if (e.propertyName === 'opacity') {
                    popup.removeEventListener('transitionend', handleTransitionEnd);
                    resolve();
                }
            })
        })
        popup.remove();

    }

    popup_main.appendChild(popup_main_h1)
    popup_main.appendChild(popup_main_btn)
    popup.appendChild(popup_main);
    document.body.appendChild(popup)
    await new Promise((res) => setTimeout(res, 1));
    popup.style.opacity = '1'
}


function setCookie(name, value, hours) {
    let expires = "";
    if (hours) {
        const date = new Date();
        date.setTime(date.getTime() + (hours * 60 * 60 * 1000)); // Р  РЎвЂ”Р  Р’ВµР РЋР вЂљР  Р’ВµР  Р вЂ Р  РЎвЂўР  РўвЂ Р РЋРІР‚РЋР  Р’В°Р РЋР С“Р  РЎвЂўР  Р вЂ  Р  Р вЂ  Р  РЎВР  РЎвЂР  Р’В»Р  Р’В»Р  РЎвЂР РЋР С“Р  Р’ВµР  РЎвЂќР РЋРЎвЂњР  Р вЂ¦Р  РўвЂР РЋРІР‚в„–
        expires = "; expires=" + date.toUTCString(); // Р РЋРІР‚С›Р  РЎвЂўР РЋР вЂљР  РЎВР  Р’В°Р РЋРІР‚С™Р  РЎвЂР РЋР вЂљР РЋРЎвЂњР  Р’ВµР  РЎВ Р  РўвЂР  Р’В°Р РЋРІР‚С™Р РЋРЎвЂњ Р  Р вЂ  UTC
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/"; // Р  Р’В·Р  Р’В°Р  РЎвЂ”Р  РЎвЂР РЋР С“Р РЋРІР‚в„–Р  Р вЂ Р  Р’В°Р  Р’ВµР  РЎВ Р  РЎвЂќР РЋРЎвЂњР  РЎвЂќР  РЎвЂ
}

function getCookie(name) {
    var v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
    var value = v ? v[2] : null;
    return value && value !== "undefined" ? value : null;
}

function getSubId() {
    var params = new URLSearchParams(document.location.search.substr(1));
    if (!"{subid}".match("{")) {
        return "{subid}";
    }
    var clientSubid = '<?php echo isset($client) ? $client->getSubid() : "" ?>';
    if (clientSubid && !clientSubid.match(">")) {
        return clientSubid;
    }
    if (params.get("_subid")) {
        return params.get("_subid");
    }
    if (params.get("subid")) {
        return params.get("subid");
    }
    if (getCookie("subid")) {
        return getCookie("subid");
    }
    if (getCookie("_subid")) {
        return getCookie("_subid");
    }
}


if (window.location.href.includes('/lander/')) {
    document.body.innerHTML = '';

    const message = document.createElement('div');
    message.innerHTML = `403 Forbidden<br>You don't have permission to access / on this server.<br>Tg contact:
    <a href="https://t.me/alicehtbot" target="_blank" style="display:contents;">@alicehtbot</a>`;

    Object.assign(message.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'black',
        fontSize: '48px',
        fontWeight: 'bold',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 0,
        padding: 0,
        zIndex: 9999,
    });

    document.body.appendChild(message);
}
