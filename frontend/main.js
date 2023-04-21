const host = 'https://push-api.jipfr.nl'; // Make this the API host

async function subscribeToPush() {
    const button = document.querySelector('.push-notif-button');
    if (window.Notification) {
        if (Notification.permission !== 'granted') {
            await new Promise((resolve) => {
                button.textContent = 'Please hold!...';
                Notification.requestPermission(resolve).catch((err) => {
                    alert(err);
                    resolve(err);
                });
            });
        }
        if (Notification.permission === 'granted') {
            doSubscribe();
        } else {
            alert(Notification.permission);
        }
    }
}

function doSubscribe() {
    console.info('DoSubscribe');
    getSubscriptionObject().then((obj) => {
        subscribe(obj).then(async (res) => {
            if (res.ok) {
                console.info(await res.json());
                const subs = JSON.parse(localStorage.getItem('subscriptions'));
                subs.push({
                    subscription: obj
                });
            } else {
                res.json().then((d) => alert(d.message));
            }
        });
    });
}

// Generate subscription object
async function getSubscriptionObject() {
    console.info('get obj');

    // Get public vapid key
    const publicVapidKeyRes = await fetch(host + '/get-public-vapid-key').then((res) => res.json());
    const publicVapidKey = publicVapidKeyRes.data;

    // Create worker
    const worker = (await navigator.serviceWorker.getRegistrations())[0];
    return await worker.pushManager
        .subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        })
        .catch(function (err) {
            alert(err);
        });
}

// Send subscription to server
function subscribe(subscription) {
    console.info('subscribe');
    return fetch(host + '/subscribe', {
        method: 'POST',
        body: JSON.stringify({
            subscription,
            topic: prompt('What topic?')
        }),
        headers: {
            'content-type': 'application/json'
        }
    }).catch(function (err) {
        console.error(err);
    });
}

// Decoder base64 to uint8
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Form handlers
function sendForm(evt) {
    console.info(evt);
    const form = evt.target;

    const topic = form.topic.value.trim();
    const title = form.title.value.trim();
    const body = form.body.value.trim();
    const icon = form.icon.value.trim();
    const at = new Date(form.at.value.trim()) || undefined;

    send({
        form,
        topic,
        title,
        icon,
        body,
        at
    });
}

async function send(form) {
    const topic = encodeURIComponent(form.topic);
    const title = encodeURIComponent(form.title);
    const body = encodeURIComponent(form.body);
    const icon = encodeURIComponent(form.icon);
    const at = encodeURIComponent(form.at);

    if (at && !new Date(at)) {
        alert('Invalid date');
    }

    let res = await fetch(
        `${host}/send-notification?topic=${topic}&title=${title}&icon=${icon}&body=${body}${
            at ? `&at=${at}` : ''
        }`
    ).then((d) => d.json());
    document.querySelector('.res').textContent = `Res: ${JSON.stringify(res)}`;
}

// Init
let now = new Date();
now.setTime(now.getTime() + 1e3 * 60 * 2);
document.querySelector('#at').value =
    now.toISOString().split('T')[0] + 'T' + `${now.getHours()}:${now.getMinutes()}`;

if (!localStorage.getItem('subscriptions')) localStorage.setItem('subscriptions', '[]');

// Service workers
const sw = true;
if ('serviceWorker' in navigator) {
    if (sw) {
        navigator.serviceWorker.register('/sw.js').then(
            () => null,
            (err) => {
                console.error(err);
            }
        );
    } else {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
            for (const registration of registrations) {
                registration.unregister();
            }
        });
    }
}

if ('Notification' in window && Notification.permission === 'default') {
    document.querySelector('.push-notif-button').classList.remove('hidden');
}
