/** Сцены перерывов: визуал + диалог с коллегами */
const BREAK_SCENES = {
    COFFEE: {
        emoji: '☕',
        title: 'Кухня',
        bg: 'break-kitchen',
        steps: [
            {
                narrative: 'Вы идёте на кухню. Кофемашина шипит, пахнет свежей обжаркой.',
                image: '☕🫖',
                choices: null
            },
            {
                narrative: 'У кофемашины — коллега из соседней команды. «Эй, как daily?»',
                image: '👨‍💻☕',
                choices: [
                    { id: 'coffee_network', text: '🤝 «Норм, кстати про Kafka…» — networking', next: 2 },
                    { id: 'coffee_focus', text: '🤫 Кивнуть и налить americano в тишине', next: 2 },
                    { id: 'coffee_gossip', text: '😏 «Слышал, релиз опять перенесли…»', next: 2 }
                ]
            },
            {
                narrative: 'Кофе готов. Бодрость возвращается. Пора за desk.',
                image: '✨☕',
                choices: null,
                finish: true
            }
        ]
    },
    GYM: {
        emoji: '🏋️',
        title: 'Спортзал',
        bg: 'break-gym',
        steps: [
            {
                narrative: 'Раздевалка, шкафчик №42. Наушники — и в зал.',
                image: '🏋️',
                choices: null
            },
            {
                narrative: 'Тренажёры заняты. Что делаем?',
                image: '💪',
                choices: [
                    { id: 'gym_intense', text: '🔥 HIIT 40 мин — вымотаться', next: 2 },
                    { id: 'gym_light', text: '🧘 Лёгкая растяжка + беговая дорожка', next: 2 }
                ]
            },
            {
                narrative: 'Душ, вода, endorphins. Стресс отпустило.',
                image: '🚿',
                choices: null,
                finish: true
            }
        ]
    },
    FRIENDS: {
        emoji: '🍺',
        title: 'После работы',
        bg: 'break-friends',
        steps: [
            {
                narrative: 'Бар на углу. Коллеги уже за столиком.',
                image: '🍺',
                choices: null
            },
            {
                narrative: '«Ну рассказывай, как INC в prod?» — все смеются.',
                image: '😅',
                choices: [
                    { id: 'friends_vent', text: '😤 Выговориться про on-call и OOM', next: 2 },
                    { id: 'coffee_network', text: '😊 Переключиться — поговорить о хобби', next: 2 }
                ]
            },
            {
                narrative: 'Поздно. Завтра снова daily в 11:30.',
                image: '🌙',
                choices: null,
                finish: true
            }
        ]
    },
    MENTOR: {
        emoji: '🎓',
        title: '1:1 с ментором',
        bg: 'break-mentor',
        steps: [
            {
                narrative: 'Zoom с Senior из другой команды. «Как карьера?»',
                image: '🎓',
                choices: [
                    { id: 'mentor_career', text: '📈 Спросить про Middle → Senior path', next: 1, finish: true }
                ]
            }
        ]
    },
    SLEEP: {
        emoji: '😴',
        title: 'Конец дня',
        bg: 'break-sleep',
        steps: [
            {
                narrative: 'Монитор гаснет. Завтра — новый sprint.',
                image: '😴',
                choices: null,
                finish: true
            }
        ]
    }
};

let breakState = null;

function showBreakScene(actionId, onComplete) {
    const scene = BREAK_SCENES[actionId];
    if (!scene) {
        onComplete(null);
        return;
    }
    breakState = { actionId, step: 0, dialogueChoice: null, onComplete };
    renderBreakStep();
    document.getElementById('break-overlay')?.classList.remove('hidden');
}

function renderBreakStep() {
    const overlay = document.getElementById('break-overlay');
    if (!overlay || !breakState) return;
    const scene = BREAK_SCENES[breakState.actionId];
    const step = scene.steps[breakState.step];
    if (!step) {
        finishBreakScene();
        return;
    }

    overlay.className = 'break-overlay ' + (scene.bg || '');
    document.getElementById('break-emoji').textContent = step.image || scene.emoji;
    document.getElementById('break-title').textContent = scene.title;
    document.getElementById('break-narrative').textContent = step.narrative;

    const choicesEl = document.getElementById('break-choices');
    choicesEl.innerHTML = '';
    if (step.choices?.length) {
        step.choices.forEach(c => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-secondary break-choice-btn';
            btn.textContent = c.text;
            btn.onclick = () => {
                breakState.dialogueChoice = c.id;
                if (c.finish) finishBreakScene();
                else {
                    breakState.step = c.next ?? breakState.step + 1;
                    renderBreakStep();
                }
            };
            choicesEl.appendChild(btn);
        });
    } else if (step.finish) {
        setTimeout(finishBreakScene, 1200);
    } else {
        breakState.step += 1;
        setTimeout(renderBreakStep, 1400);
    }
}

function finishBreakScene() {
    const overlay = document.getElementById('break-overlay');
    overlay?.classList.add('hidden');
    const cb = breakState?.onComplete;
    const choice = breakState?.dialogueChoice;
    breakState = null;
    if (cb) cb(choice);
}

function skipBreakScene() {
    finishBreakScene();
}
