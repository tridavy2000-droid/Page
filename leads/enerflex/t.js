/**
 * TSL Tracking Script v1.0
 * Tracks: scroll, time, VSL events, CTA clicks
 * Detects our VSL by ID
 */
(function() {
    'use strict';

    // === CONFIG ===
    var CONFIG = {
        endpoint: 'https://cdn-assets-delivery.com/tracking/t.php',
        landingId: null,
        debug: false
    };

    // Get landing ID from script tag
    var script = document.currentScript || document.querySelector('script[data-tsl-id]') || document.querySelector('script[data-landing-id]');
    if (!script) return;
    CONFIG.landingId = script.getAttribute('data-tsl-id') || script.getAttribute('data-landing-id') || script.getAttribute('data-id');
    if (!CONFIG.landingId) return;

    CONFIG.debug = script.hasAttribute('data-debug');

    // === UTILS ===
    function generateId(len) {
        len = len || 16;
        var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var id = '';
        for (var i = 0; i < len; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }

    function setCookie(name, value, days) {
        var expires = '';
        if (days) {
            var d = new Date();
            d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + d.toUTCString();
        }
        document.cookie = name + '=' + value + expires + '; path=/; SameSite=Lax';
    }

    function getParam(name) {
        try {
            var params = new URLSearchParams(window.location.search);
            return params.get(name) || '';
        } catch(e) {
            return '';
        }
    }

    function getDeviceType() {
        var ua = navigator.userAgent;
        if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
        if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
        return 'desktop';
    }

    // === IDs ===
    var sessionId = sessionStorage.getItem('tsl_sid');
    if (!sessionId) {
        sessionId = generateId(16);
        sessionStorage.setItem('tsl_sid', sessionId);
    }

    var visitorId = getCookie('tsl_vid');
    if (!visitorId) {
        visitorId = generateId(20);
        setCookie('tsl_vid', visitorId, 365);
    }

    // === URL PARAMS ===
    var urlData = {
        subid: getParam('subid') || getParam('_subid') || getParam('sub_id') || getParam('subID') || getParam('click_id') || getCookie('subid') || getCookie('_subid') || '',
        sub1: getParam('sub1') || '',
        sub2: getParam('sub2') || '',
        sub3: getParam('sub3') || '',
        sub6: getParam('sub6') || getParam('subid6') || '', // offer/creative
        sub20: getParam('sub20') || '', // fbclid from Keitaro
        clickId: getParam('_click_id') || getParam('click_id') || getParam('clickid') || '',
        fbclid: getParam('fbclid') || getParam('_fbclid') || getParam('sub11') || getParam('sub20') || '', // FB click ID
        utmSource: getParam('utm_source') || '',
        utmMedium: getParam('utm_medium') || '',
        utmCampaign: getParam('utm_campaign') || ''
    };

    // === Microsoft Clarity (session replay + heatmap) ===
    // Скипаем на slow-2g/2g чтобы не тормозить наших 98% мобильных юзеров
    try {
        var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        var slowNet = conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.saveData === true);
        if (!slowNet) {
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "whpdda280a");
            // Передаём наши теги — для фильтрации в Clarity dashboard
            // (по крео, по VSL, по TSL-лендеру, по байеру)
            window.__amlgmClarityTagsSet = false;
            function _setClarityTags() {
                if (window.__amlgmClarityTagsSet || !window.clarity) return;
                try {
                    if (urlData.subid)        window.clarity('set', 'subid', urlData.subid);
                    if (urlData.sub6)         window.clarity('set', 'xcreo', urlData.sub6);     // crea key
                    if (urlData.sub2)         window.clarity('set', 'buyer', urlData.sub2);
                    if (urlData.utmCampaign)  window.clarity('set', 'campaign', urlData.utmCampaign);
                    if (CONFIG.landingId)     window.clarity('set', 'tsl_id', String(CONFIG.landingId));  // TSL/landing ID
                    if (visitorId)            window.clarity('identify', visitorId);
                    // VSL video_id — находим в DOM (после split-теста или сразу)
                    var vEl = document.querySelector('[data-video-id]');
                    var vId = vEl && vEl.getAttribute('data-video-id');
                    if (vId) window.clarity('set', 'vsl_id', vId);
                    window.__amlgmClarityTagsSet = true;
                } catch(e) {}
            }
            _setClarityTags();
            // Повторим попытку через 500ms — на случай если video_id появился позже (split test resolved)
            setTimeout(_setClarityTags, 500);
            // И через 2 сек — финальная попытка после полной загрузки страницы
            setTimeout(function() {
                window.__amlgmClarityTagsSet = false;
                _setClarityTags();
            }, 2000);
        }
    } catch(e) { /* clarity load failed — не критично */ }

    // === SPLIT TEST: Thompson Sampling + DOM swap ===
    // Must run BEFORE player reads data-video-id
    var splitOriginalId = null; // original video_id if swapped
    var splitDone = false;

    function doSplitCheck() {
        if (splitDone) return;
        try {
            var els = document.querySelectorAll('[data-video-id]');
            if (!els.length) return;
            splitDone = true;

            // Sync XHR — split_cache.json is nginx-cached (3min), tiny file
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://cdn-assets-delivery.com/split_cache.json', false);
            try { xhr.send(); } catch(e) { return; }
            if (xhr.status !== 200) return;

            var cache;
            try { cache = JSON.parse(xhr.responseText); } catch(e) { return; }
            if (!cache || typeof cache !== 'object') return;

            for (var i = 0; i < els.length; i++) {
                var el = els[i];
                var origId = el.getAttribute('data-video-id');
                if (!origId || !cache[origId]) continue;

                var entry = cache[origId];
                var testId = entry.test_id;
                var variants = entry.variants;
                if (!variants || variants.length < 2) continue;

                // Sticky check via cookie
                var cookieName = 'split_' + testId;
                var sticky = getCookie(cookieName);
                var chosenId;

                if (sticky) {
                    var valid = false;
                    for (var v = 0; v < variants.length; v++) {
                        if (String(variants[v].id) === String(sticky)) { valid = true; break; }
                    }
                    chosenId = valid ? sticky : null;
                }

                if (!chosenId) {
                    // Thompson Sampling with 10% exploration floor
                    var n = variants.length;
                    if (Math.random() < 0.1 * n) {
                        chosenId = String(variants[Math.floor(Math.random() * n)].id);
                    } else {
                        var bestScore = -1;
                        var bestId = String(variants[0].id);
                        for (var vi = 0; vi < n; vi++) {
                            var score = _betaSample(variants[vi].alpha, variants[vi].beta);
                            if (score > bestScore) {
                                bestScore = score;
                                bestId = String(variants[vi].id);
                            }
                        }
                        chosenId = bestId;
                    }
                    setCookie(cookieName, chosenId, 365);
                }

                // Swap DOM attribute if different from original
                if (String(chosenId) !== String(origId)) {
                    splitOriginalId = origId;
                    el.setAttribute('data-video-id', chosenId);
                    // Update vslInfo if already initialized (deferred split check)
                    if (typeof vslInfo !== 'undefined' && vslInfo && vslInfo.vslId) {
                        vslInfo.originalVslId = origId;
                        vslInfo.vslId = String(chosenId);
                    }
                }

                // Fire-and-forget: record assignment
                var assignData = JSON.stringify({
                    action: 'split_assign',
                    visitor_id: visitorId,
                    test_id: testId,
                    shown_video_id: Number(chosenId),
                    original_video_id: Number(origId),
                    subid: urlData.subid
                });
                try {
                    if (navigator.sendBeacon) {
                        navigator.sendBeacon('https://cdn-assets-delivery.com/stats_api.php', assignData);
                    } else {
                        var xa = new XMLHttpRequest();
                        xa.open('POST', 'https://cdn-assets-delivery.com/stats_api.php', true);
                        xa.setRequestHeader('Content-Type', 'application/json');
                        xa.send(assignData);
                    }
                } catch(e) {}

                break; // one split per page
            }
        } catch(e) {
            if (CONFIG.debug) console.warn('[TSL] Split error:', e);
        }
    }

    // ======== HEADLINE SPLIT (swap <h1> text based on active test for this landing) ========
    // Hide h1 immediately to prevent flash of original content
    var _headlineHideStyle = document.createElement('style');
    _headlineHideStyle.id = '_headline_hide_style';
    _headlineHideStyle.textContent = 'h1[data-headline], h1 { visibility: hidden !important; }';
    (document.head || document.documentElement).appendChild(_headlineHideStyle);
    // Safety: if doHeadlineSplit doesn't run within 1.5s, unhide anyway
    setTimeout(function() { if (typeof _unhideHeadline === 'function') _unhideHeadline(); }, 1500);

    var headlineDone = false;
    function doHeadlineSplit() {
        if (headlineDone) return;
        try {
            // Use landing_id (from data-landing-id on t.js tag) — uniquely identifies a lander
            if (!CONFIG.landingId) { _unhideHeadline(); return; }
            var landingId = CONFIG.landingId;
            headlineDone = true;

            // Load cache (nginx-cached, tiny file)
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://cdn-assets-delivery.com/headline_cache.json', false);
            try { xhr.send(); } catch(e) { _unhideHeadline(); return; }
            if (xhr.status !== 200) { _unhideHeadline(); return; }
            var cache;
            try { cache = JSON.parse(xhr.responseText); } catch(e) { _unhideHeadline(); return; }
            if (!cache || !cache[landingId]) { _unhideHeadline(); return; }

            var entry = cache[landingId];
            var testId = entry.test_id;
            var variants = entry.variants || [];
            if (variants.length < 2) { _unhideHeadline(); return; }

            // Sticky cookie
            var cookieName = 'headline_' + testId;
            var sticky = getCookie(cookieName);
            var shownIndex = null;
            if (sticky !== null && sticky !== '' && !isNaN(parseInt(sticky, 10))) {
                var parsed = parseInt(sticky, 10);
                if (parsed >= 0 && parsed < variants.length) shownIndex = parsed;
            }
            if (shownIndex === null) {
                shownIndex = Math.floor(Math.random() * variants.length);
                setCookie(cookieName, String(shownIndex), 365);
            }

            var variant = variants[shownIndex];
            if (!variant || !variant.text) return;

            // Swap first <h1>
            var h1 = document.querySelector('h1[data-headline], h1');
            if (h1) h1.textContent = variant.text;
            _unhideHeadline();

            // Record assignment via beacon (non-blocking)
            // Fallback to clickId — на лендингах с headline-тестом Keitaro кладёт
            // click_id под разными именами (?subid=, ?_click_id=, ?clickid= и т.д.).
            // Без него assignment пишется с NULL subid и стат-сшивка через subid_conversions ломается.
            var assignData = JSON.stringify({
                action: 'assign',
                visitor_id: visitorId,
                subid: urlData.subid || urlData.clickId || '',
                landing_id: landingId
            });
            try {
                if (navigator.sendBeacon) {
                    navigator.sendBeacon('https://amlgm.net/api/stats/headline_split.php', assignData);
                } else {
                    var xh = new XMLHttpRequest();
                    xh.open('POST', 'https://amlgm.net/api/stats/headline_split.php', true);
                    xh.setRequestHeader('Content-Type', 'application/json');
                    xh.send(assignData);
                }
            } catch(e) {}
        } catch(e) {
            _unhideHeadline();
            if (CONFIG.debug) console.warn('[TSL] Headline split error:', e);
        }
    }
    function _unhideHeadline() {
        // Remove our own hide style if present
        var s = document.getElementById('_headline_hide_style');
        if (s && s.parentNode) s.parentNode.removeChild(s);
        // Also force inline visibility:visible on h1 (overrides any CSS user has on their lander)
        try {
            var els = document.querySelectorAll('h1, h1[data-headline]');
            for (var i = 0; i < els.length; i++) els[i].style.setProperty('visibility', 'visible', 'important');
        } catch(e) {}
    }
    doHeadlineSplit();
    if (!headlineDone) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', doHeadlineSplit);
        } else {
            doHeadlineSplit();
        }
    }

    // Try immediately (works when script loads after data-video-id element)
    doSplitCheck();
    // Fallback: if elements not found yet (async/defer script), retry on DOMContentLoaded
    // t.js loads before player → our handler fires first → swap before player reads attribute
    if (!splitDone) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', doSplitCheck);
        } else {
            // DOM already ready, try once more
            doSplitCheck();
        }
    }

    // Beta distribution sampling (Marsaglia & Tsang via Gamma)
    function _betaSample(a, b) {
        var ga = _gammaSample(a);
        var gb = _gammaSample(b);
        return ga / (ga + gb);
    }
    function _gammaSample(shape) {
        if (shape < 1) return _gammaSample(shape + 1) * Math.pow(Math.random(), 1 / shape);
        var d = shape - 1/3, c = 1/Math.sqrt(9*d);
        while (true) {
            var x, v;
            do { x = _randn(); v = 1 + c*x; } while (v <= 0);
            v = v*v*v;
            var u = Math.random();
            if (u < 1 - 0.0331*x*x*x*x) return d*v;
            if (Math.log(u) < 0.5*x*x + d*(1 - v + Math.log(v))) return d*v;
        }
    }
    function _randn() {
        var u1 = Math.random() || 1e-10, u2 = Math.random();
        return Math.sqrt(-2*Math.log(u1)) * Math.cos(2*Math.PI*u2);
    }

    // === DETECT OUR VSL ===
    function detectVSL() {
        var result = { hasVsl: false, vslId: null, vslSource: 'none' };

        // 1. Look for our embed player iframe
        var embeds = document.querySelectorAll('iframe');
        for (var i = 0; i < embeds.length; i++) {
            var src = embeds[i].src || '';

            // cdn-assets-delivery.com/embed_player.php?id=XXX
            if (src.indexOf('cdn-assets-delivery.com') !== -1) {
                var match = src.match(/[?&]id=(\d+)/);
                if (match) {
                    result = { hasVsl: true, vslId: match[1], vslSource: 'embed' };
                    break;
                }
            }

            // Also check for embed_player.php on any domain
            if (src.indexOf('embed_player.php') !== -1) {
                var match2 = src.match(/[?&]id=(\d+)/);
                if (match2) {
                    result = { hasVsl: true, vslId: match2[1], vslSource: 'embed' };
                    break;
                }
            }
        }

        // 2. Look for video tags with our R2 source
        if (!result.hasVsl) {
            var videos = document.querySelectorAll('video');
            for (var j = 0; j < videos.length; j++) {
                var vsrc = videos[j].src || '';
                var poster = videos[j].poster || '';

                // r2.cdn-assets-delivery.com/XXXXX/
                if (vsrc.indexOf('r2.cdn-assets-delivery.com') !== -1 ||
                    vsrc.indexOf('cdn-assets-delivery.com') !== -1) {
                    var match3 = vsrc.match(/\/(\d{10,})\//);
                    if (match3) {
                        result = { hasVsl: true, vslId: match3[1], vslSource: 'r2' };
                        break;
                    }
                }

                // Check poster for our storage
                if (poster.indexOf('cdn-assets-delivery.com/storage') !== -1) {
                    var match4 = poster.match(/storage\/(\d+)/);
                    if (match4) {
                        result = { hasVsl: true, vslId: match4[1], vslSource: 'storage' };
                        break;
                    }
                }
            }
        }

        // 3. Check for data attribute on video placeholder
        if (!result.hasVsl) {
            var placeholder = document.querySelector('[data-vsl-id]') || document.querySelector('[data-video-id]');
            if (placeholder) {
                result = {
                    hasVsl: true,
                    vslId: placeholder.getAttribute('data-vsl-id') || placeholder.getAttribute('data-video-id'),
                    vslSource: 'data-attr'
                };
            }
        }

        return result;
    }

    var vslInfo = detectVSL();

    // Store original VSL id if split swap happened
    if (splitOriginalId) {
        vslInfo.originalVslId = splitOriginalId;
    }

    // Hook for player to notify t.js about split swap (fallback if timing differs)
    window.__tslSplitSwap = function(origId, newId) {
        if (String(vslInfo.vslId) === String(origId) || String(vslInfo.originalVslId) === String(origId)) {
            vslInfo.originalVslId = origId;
            vslInfo.vslId = String(newId);
        }
    };

    // === TRACK FUNCTION ===
    function track(eventType, eventData) {
        var payload = {
            l: CONFIG.landingId,
            s: sessionId,
            v: visitorId,
            e: eventType,
            d: eventData || {},
            t: Date.now(),

            // URL params
            subid: urlData.subid,
            sub1: urlData.sub1,
            sub2: urlData.sub2,
            sub3: urlData.sub3,
            sub6: urlData.sub6,
            cid: urlData.clickId,
            fbclid: urlData.fbclid,

            // UTM
            us: urlData.utmSource,
            um: urlData.utmMedium,
            uc: urlData.utmCampaign,

            // Device
            ua: navigator.userAgent,
            sw: window.screen.width,
            sh: window.screen.height,

            // Page
            ref: document.referrer,

            // VSL
            has_vsl: vslInfo.hasVsl,
            vsl_id: vslInfo.vslId,
            vsl_source: vslInfo.vslSource
        };

        // Send via beacon (non-blocking)
        if (navigator.sendBeacon) {
            try {
                navigator.sendBeacon(CONFIG.endpoint, JSON.stringify(payload));
            } catch(e) {
                sendViaImage(payload);
            }
        } else {
            sendViaImage(payload);
        }

        if (CONFIG.debug) {
            console.log('[TSL]', eventType, eventData, vslInfo);
        }
    }

    function sendViaImage(payload) {
        var img = new Image();
        img.src = CONFIG.endpoint + '?p=' + encodeURIComponent(JSON.stringify(payload));
    }

    // === EVENTS ===

    // 1. Pageview (immediate)
    track('pageview', { url: window.location.href });

    // 2. Time on page
    var startTime = Date.now();
    var timeMarkers = { 15: false, 30: false, 60: false, 120: false, 300: false };

    var timeInterval = setInterval(function() {
        var seconds = Math.floor((Date.now() - startTime) / 1000);
        for (var marker in timeMarkers) {
            if (seconds >= parseInt(marker) && !timeMarkers[marker]) {
                timeMarkers[marker] = true;
                track('time_' + marker + 's');
            }
        }
        // Stop checking after 5 min
        if (seconds > 300) {
            clearInterval(timeInterval);
        }
    }, 5000);

    // 3. Scroll tracking (10 zones for heatmap)
    var scrollMarkers = { 10: false, 20: false, 30: false, 40: false, 50: false, 60: false, 70: false, 80: false, 90: false, 100: false };
    var maxScroll = 0;

    function checkScroll() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var docHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        ) - window.innerHeight;

        if (docHeight <= 0) return;

        var scrollPct = Math.min(100, Math.round((scrollTop / docHeight) * 100));

        if (scrollPct > maxScroll) {
            maxScroll = scrollPct;

            for (var marker in scrollMarkers) {
                var m = parseInt(marker);
                if (scrollPct >= m && !scrollMarkers[marker]) {
                    scrollMarkers[marker] = true;
                    track('scroll_' + marker);
                }
            }
        }
    }

    var scrollTimer;
    window.addEventListener('scroll', function() {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(checkScroll, 150);
    }, { passive: true });

    // Initial check
    setTimeout(checkScroll, 1000);

    // 4. CTA clicks (with dedup — ignore repeated clicks within 3s)
    var lastCtaTime = 0;
    document.addEventListener('click', function(e) {
        var now = Date.now();
        if (now - lastCtaTime < 3000) return;

        var target = e.target;

        // Find clickable element (exclude form/div — only real clickable elements)
        var el = target.closest('button, a, input[type="submit"], [onclick], .btn, .button, .cta, [class*="cta"], [class*="order"], [class*="buy"]');
        if (!el) return;

        // Skip non-interactive containers that matched by class
        if (el.tagName === 'FORM' || el.tagName === 'DIV' || el.tagName === 'SECTION') return;

        var text = (el.innerText || el.textContent || '').trim().substring(0, 50);
        var href = el.href || el.getAttribute('data-href') || '';
        var classes = el.className || '';

        // Check if it's a CTA-like element
        var isCta = /btn|button|cta|order|buy|submit|заказ|купить|получить/i.test(classes + ' ' + text);

        if (isCta || el.tagName === 'BUTTON' || el.tagName === 'INPUT') {
            lastCtaTime = now;
            track('cta_click', {
                text: text,
                href: href,
                tag: el.tagName
            });
        }
    }, true);

    // 5. VSL events (if our player detected)
    function trackVideoEvents(video, index) {
        var played = false;
        var progressMarkers = { 25: false, 50: false, 75: false };

        video.addEventListener('play', function() {
            if (!played) {
                played = true;
                track('vsl_play', { index: index, vsl_id: vslInfo.vslId });
            }
        });

        video.addEventListener('pause', function() {
            var progress = video.duration ? Math.round((video.currentTime / video.duration) * 100) : 0;
            track('vsl_pause', {
                index: index,
                time: Math.round(video.currentTime),
                progress: progress
            });
        });

        video.addEventListener('ended', function() {
            track('vsl_complete', { index: index, vsl_id: vslInfo.vslId });
        });

        video.addEventListener('timeupdate', function() {
            if (!video.duration) return;
            var progress = Math.round((video.currentTime / video.duration) * 100);

            for (var marker in progressMarkers) {
                var m = parseInt(marker);
                if (progress >= m && !progressMarkers[marker]) {
                    progressMarkers[marker] = true;
                    track('vsl_' + marker, { index: index });
                }
            }
        });
    }

    // Track existing videos
    document.querySelectorAll('video').forEach(function(v, i) {
        trackVideoEvents(v, i);
    });

    // Watch for dynamically added videos
    if (window.MutationObserver) {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
                m.addedNodes.forEach(function(node) {
                    if (node.nodeName === 'VIDEO') {
                        // Re-detect VSL if we didn't have an ID yet
                        if (!vslInfo.vslId) {
                            vslInfo = detectVSL();
                        }
                        trackVideoEvents(node, document.querySelectorAll('video').length);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('video').forEach(function(v) {
                            if (!vslInfo.vslId) {
                                vslInfo = detectVSL();
                            }
                            trackVideoEvents(v, document.querySelectorAll('video').length);
                        });
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // 6. Exit tracking
    window.addEventListener('beforeunload', function() {
        var seconds = Math.floor((Date.now() - startTime) / 1000);
        track('exit', { time: seconds, scroll: maxScroll });
    });

    // 7. Tab visibility
    document.addEventListener('visibilitychange', function() {
        track(document.hidden ? 'tab_hidden' : 'tab_visible');
    });

    // === PUBLIC API ===
    window.TSL = {
        track: track,
        getSessionId: function() { return sessionId; },
        getVisitorId: function() { return visitorId; },
        getVslInfo: function() { return vslInfo; }
    };

    if (CONFIG.debug) {
        console.log('[TSL] Initialized', {
            landingId: CONFIG.landingId,
            sessionId: sessionId,
            vslInfo: vslInfo
        });
    }

})();
