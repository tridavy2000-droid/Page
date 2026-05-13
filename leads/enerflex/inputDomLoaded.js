document.addEventListener('DOMContentLoaded', function () {
    let body = document.querySelector('body');
    let currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 24);


    localStorage.getItem('currentDate') ?? localStorage.setItem('currentDate', currentDate.getTime());
    if (localStorage.getItem('currentDate') && localStorage.getItem('currentDate') < Date.now()) {
        localStorage.clear()
    }


    const regex = /^\{.*\}$/;
    const regex2 = /^%7B.*%7D$/;


    for (const [key, value] of Array.from(parametr.entries())) {

        const decodedValue = decodeURIComponent(value);

        if (regex.test(decodedValue) || regex2.test(encodeURIComponent(decodedValue)) || !decodedValue) {
            parametr.delete(key);
        }
    }

    if (parametr.has('_token')) {
        parametr.delete('_token')
    }

    document.querySelectorAll(`${scrollItem}`).forEach((el) => {
        el.onclick = (e) => {
            e.preventDefault()
            // document.querySelector(`${scrollblock}`).scrollIntoView({behavior: "smooth", block: "center"})

            window.scrollTo({
                behavior: "smooth",
                top: document.querySelector(`${scrollblock}`).getBoundingClientRect().top + window.scrollY
            })
        }
    })


    const updatedQueryString = parametr.toString();
    console.log(updatedQueryString);

    let mess = 'Compruebe si el número de teléfono está introducido correctamente. Si el número se ingresó correctamente, actualice la página y vuelva a intentarlo.'


    const LAZY = document.querySelectorAll('img');
    for (let i = 0; i < LAZY.length; i++) {
        LAZY[i].setAttribute('loading', 'lazy');
    }


    function isResultOk(result) {
        return result.status === 'ok' ||
            result.status === 'success' ||
            result.order_id ||
            result.uuid ||
            (result.api && result.api.success === true) ||
            result.result === 'ok' ||
            result.message === 'OK' ||
            result.success === true ||
            result.code === 200 ||
            result.code === 'ok' ||
            result === 'Lead added successfully' ||
            result.ok === true ||
            (result.data && result.data.success === true) ||
            result.type === 'success' ||
            (result.data && result.data.id ) ||
            (result.response && result.response.status === 'success');
    }


    if (parametr.has('pixel')) setCookie('pixel', parametr.get('pixel'), 24)



    if (parametr.has('dm')) {
        const dmValues = parametr.get('dm').split(',');
        if (dmValues.length >= 2 && dmValues[0] && dmValues[1]) {
            domonetka(dmValues[0], dmValues[1]);
        }
    } else {
        const iframe = document.querySelector('#iframe');
        if (iframe) {
            iframe.remove();
        }
    }


    let order = localStorage.getItem('order') ?? 0;

    function strt() {
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
            utm_medium.value = parametr.get('xbaer') ?? parametr.get('utm_medium');
            utm_medium.name = 'sub2';
            utm_medium.type = 'hidden';

            if (parametr.has('xtoken')) {
                let xtoken = document.createElement('input');
                xtoken.value = parametr.get('xtoken');
                xtoken.name = 'xtoken';
                xtoken.type = 'hidden';
                el.insertAdjacentElement("afterbegin", xtoken);

            }

            el.insertAdjacentElement("afterbegin", subid);
            el.insertAdjacentElement("afterbegin", utm_medium);


            phone.setAttribute('maxlength', maxLength + country_code.length)

            btn.setAttribute('disabled', 'true');
            btn.style.opacity = '0.5';

            phone.oninput = function (e) {
                this.value = this.value.replace(/[^\d]/gi, '');
                if (!this.value.startsWith(country_code)) {
                    this.value = country_code + this.value.slice(country_code.length - 1);
                }
                if (this.value.length >= country_code.length + minlength && this.value.length <= country_code.length + maxLength) {
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
                if (!this.value.startsWith(country_code)) {
                    this.value = country_code + this.value
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

                        if (parametr.has('lang') && !redirectUrl) {
                            const langValues = parametr.get('lang').split(',');
                            const lang = langValues[0];
                            const gender = langValues[1];

                            if (lang && gender) {
                                location.href = `${location.protocol}//${location.host}/lander/success/index.php?lang=${lang}&gender=${gender}`;
                            } else if (lang) {
                                location.href = `${location.protocol}//${location.host}/lander/success/index.php?lang=${lang}`;
                            } else {
                                location.href = `${location.protocol}//${location.host}/lander/success/index.php`;
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
        strt()
    })();


    function domonetka(comID, dam) {
        let compainID = comID;
        let dm = dam;
        let html = `<iframe id="iframe" src="" frameborder="0"></iframe>`;
        body.insertAdjacentHTML('afterbegin', html);
        let iframe = document.querySelector('#iframe');
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.zIndex = '100000000';
        iframe.style.display = 'none';
        iframe.style.backgroundColor = 'white';

        if (parametr.has('utm_content')) {
            parametr.delete('utm_content')
        }

        if (parametr.has('ad_id')) {
            parametr.delete('ad_id');
        }


        parametr.set('dm', dm);
        parametr.set('fbtoken', parametr.get('token'));
        parametr.delete('token');
        parametr.delete('offer');
        iframe.style.overflow = 'auto';
        iframe.setAttribute('src', `${location.protocol}//${location.host}/${compainID}?${parametr.toString()}`);
        // iframe.setAttribute('src', `${location.protocol}//${location.host}/${compainID}?utm_medium=${parametr.get('utm_medium')}&dm=${parametr.get('dm')}`);


        history.pushState('1', '', location.href);
        history.pushState('2', '', location.href);

        window.onpopstate = function (event) {
            if (event.state === "1") {
                iframe.style.display = 'block';
                body.style.overflow = 'hidden';
                // location.href = `${location.protocol}//${location.host}/${compainID}?${parametr.toString()}`

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
            date.setTime(date.getTime() + (hours * 60 * 60 * 1000)); // перевод часов в миллисекунды
            expires = "; expires=" + date.toUTCString(); // форматируем дату в UTC
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/"; // записываем куки
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


})

