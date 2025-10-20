(() => {
    const USERS_KEY = 'apmUsers';
    const CURRENT_USER_KEY = 'apmCurrentUser';

    const getJson = (key, fallback) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    };

    const getUsers = () => {
        const users = getJson(USERS_KEY, []);
        return Array.isArray(users) ? users : [];
    };

    const saveUsers = (users) => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    };

    const getCurrentUser = () => getJson(CURRENT_USER_KEY, null);

    const setCurrentUser = (user) => {
        if (!user) {
            localStorage.removeItem(CURRENT_USER_KEY);
            return;
        }
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    };

    const createTriggerButton = (label, mode) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'account-trigger';
        button.textContent = label;
        button.dataset.accountMode = mode;
        return button;
    };

    const ensureNavTrigger = () => {
        const nav = document.querySelector('.nav-links');
        if (!nav || document.getElementById('accountNavItem')) {
            return;
        }

        const navItem = document.createElement('li');
        navItem.id = 'accountNavItem';

        const buttonsWrapper = document.createElement('div');
        buttonsWrapper.className = 'account-trigger-group';

        const signInButton = createTriggerButton('Sign In', 'signin');
        signInButton.id = 'accountTrigger';
        const signUpButton = createTriggerButton('Sign Up', 'signup');
        signUpButton.classList.add('account-trigger--ghost');

        [signInButton, signUpButton].forEach((trigger) => {
            trigger.addEventListener('click', (event) => {
                event.preventDefault();
                openModal(trigger.dataset.accountMode);
            });
            buttonsWrapper.append(trigger);
        });

        navItem.append(buttonsWrapper);

        const cta = nav.querySelector('.nav-cta');
        if (cta) {
            nav.insertBefore(navItem, cta);
        } else {
            nav.append(navItem);
        }
    };

    const ensureModal = () => {
        let modal = document.getElementById('accountModal');
        if (modal) {
            return modal;
        }

        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="account-modal" id="accountModal" aria-hidden="true">
                <div class="account-modal__backdrop" data-account-close="true"></div>
                <div class="account-modal__dialog" role="dialog" aria-modal="true">
                    <button class="account-modal__close" type="button" data-account-close="true" aria-label="Close account dialog">✕</button>
                    <div class="account-modal__content">
                        <div class="account-forms" id="accountForms">
                            <header class="account-header">
                                <h3 id="accountFormTitle">Welcome Back</h3>
                                <p class="account-subtitle" id="accountFormSubtitle">Sign in to sync your activity across the site.</p>
                            </header>
                            <nav class="account-tabs" aria-label="Account mode">
                                <button type="button" class="account-tab account-tab--active" data-account-switch="signin">Sign In</button>
                                <button type="button" class="account-tab" data-account-switch="signup">Create Account</button>
                            </nav>
                            <form id="signInForm" class="account-form" novalidate>
                                <div class="account-field">
                                    <label for="signInEmail">Email</label>
                                    <input id="signInEmail" type="email" required autocomplete="email" placeholder="you@example.com">
                                </div>
                                <div class="account-field">
                                    <label for="signInPassword">Password</label>
                                    <input id="signInPassword" type="password" required autocomplete="current-password" placeholder="Enter password">
                                </div>
                                <div class="account-message" id="signInMessage" aria-live="polite"></div>
                                <button type="submit" class="account-submit">Sign In</button>
                            </form>
                            <form id="signUpForm" class="account-form" hidden novalidate>
                                <div class="account-field">
                                    <label for="signUpName">Full Name</label>
                                    <input id="signUpName" type="text" required autocomplete="name" placeholder="Your full name">
                                </div>
                                <div class="account-field">
                                    <label for="signUpEmail">Email</label>
                                    <input id="signUpEmail" type="email" required autocomplete="email" placeholder="you@example.com">
                                </div>
                                <div class="account-field">
                                    <label for="signUpPassword">Password</label>
                                    <input id="signUpPassword" type="password" minlength="6" required autocomplete="new-password" placeholder="Minimum 6 characters">
                                </div>
                                <div class="account-message" id="signUpMessage" aria-live="polite"></div>
                                <button type="submit" class="account-submit">Create Account</button>
                            </form>
                        </div>
                        <div class="account-summary" id="accountSummary" hidden>
                            <div class="account-summary__header">
                                <h3 id="accountWelcome"></h3>
                                <p class="account-summary__subtitle">You are signed in and your activity is being tracked.</p>
                            </div>
                            <div class="account-summary-row">
                                <span class="account-summary-label">Email</span>
                                <span id="accountEmail"></span>
                            </div>
                            <div class="account-summary-actions">
                                <button type="button" class="account-submit account-submit--secondary" id="accountSignOut">Sign Out</button>
                            </div>
                            <div class="account-activity">
                                <h4>Your recent activity</h4>
                                <ul id="accountActivity"></ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal = wrapper.firstElementChild;
        document.body.append(modal);

        modal.querySelectorAll('[data-account-close="true"]').forEach((element) => {
            element.addEventListener('click', closeModal);
        });

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        const signInForm = modal.querySelector('#signInForm');
        const signUpForm = modal.querySelector('#signUpForm');
        const signInMessage = modal.querySelector('#signInMessage');
        const signUpMessage = modal.querySelector('#signUpMessage');
        const tabButtons = modal.querySelectorAll('[data-account-switch]');
        const signOutButton = modal.querySelector('#accountSignOut');
        const titleEl = modal.querySelector('#accountFormTitle');
        const subtitleEl = modal.querySelector('#accountFormSubtitle');

        const resetMessages = () => {
            signInMessage.textContent = '';
            signInMessage.dataset.type = '';
            signUpMessage.textContent = '';
            signUpMessage.dataset.type = '';
        };

        const showForm = (mode) => {
            resetMessages();
            const isSignUp = mode === 'signup';
            signUpForm.hidden = !isSignUp;
            signInForm.hidden = isSignUp;

            tabButtons.forEach((tab) => {
                tab.classList.toggle('account-tab--active', tab.dataset.accountSwitch === mode);
            });

            titleEl.textContent = isSignUp ? 'Create your account' : 'Welcome back';
            subtitleEl.textContent = isSignUp
                ? 'Sign up to store your favourites and checkout faster.'
                : 'Sign in to sync your activity across the site.';

            const firstInput = isSignUp ? signUpForm.querySelector('input') : signInForm.querySelector('input');
            requestAnimationFrame(() => firstInput?.focus());
        };

        tabButtons.forEach((tab) => {
            tab.addEventListener('click', () => {
                showForm(tab.dataset.accountSwitch);
            });
        });

        const validateEmail = (email) => /.+@.+\..+/.test(email);

        signInForm.addEventListener('submit', (event) => {
            event.preventDefault();
            resetMessages();

            const email = signInForm.signInEmail.value.trim().toLowerCase();
            const password = signInForm.signInPassword.value;

            if (!validateEmail(email) || !password) {
                signInMessage.textContent = 'Please enter a valid email and password.';
                signInMessage.dataset.type = 'error';
                return;
            }

            const users = getUsers();
            const user = users.find((entry) => entry.email === email && entry.password === password);

            if (!user) {
                signInMessage.textContent = 'Invalid email or password. Try again or create a new account.';
                signInMessage.dataset.type = 'error';
                return;
            }

            setCurrentUser(user);
            updateAccountView();
            closeModal();
        });

        signUpForm.addEventListener('submit', (event) => {
            event.preventDefault();
            resetMessages();

            const name = signUpForm.signUpName.value.trim();
            const email = signUpForm.signUpEmail.value.trim().toLowerCase();
            const password = signUpForm.signUpPassword.value;

            if (!name || !validateEmail(email) || password.length < 6) {
                signUpMessage.textContent = 'Please fill all fields (password must be at least 6 characters).';
                signUpMessage.dataset.type = 'error';
                return;
            }

            const users = getUsers();

            if (users.some((entry) => entry.email === email)) {
                signUpMessage.textContent = 'An account with this email already exists.';
                signUpMessage.dataset.type = 'error';
                return;
            }

            const newUser = {
                name,
                email,
                password,
                activities: []
            };

            users.push(newUser);
            saveUsers(users);
            setCurrentUser(newUser);
            updateAccountView();
            closeModal();
            signUpForm.reset();
        });

        signOutButton.addEventListener('click', () => {
            setCurrentUser(null);
            updateAccountView();
            closeModal();
        });

        modal.dataset.accountReady = 'true';
        showForm('signin');

        return modal;
    };

    const renderActivityList = (user) => {
        const activityList = document.getElementById('accountActivity');
        if (!activityList) {
            return;
        }

        const activities = user?.activities || [];

        if (!activities.length) {
            activityList.innerHTML = '<li class="account-activity-empty">No activity tracked yet.</li>';
            return;
        }

        activityList.innerHTML = activities
            .slice()
            .reverse()
            .map((entry) => {
                const date = new Date(entry.timestamp);
                const timeText = `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                const detail = entry.details ? ` – ${entry.details}` : '';
                return `<li><span class="account-activity-type">${entry.type}</span><span class="account-activity-main">${entry.label || ''}${detail}</span><span class="account-activity-time">${timeText}</span></li>`;
            })
            .join('');
    };

    const updateAccountView = () => {
        const trigger = document.getElementById('accountTrigger');
        const triggerGroup = document.querySelector('.account-trigger-group');
        const forms = document.getElementById('accountForms');
        const summary = document.getElementById('accountSummary');
        const welcome = document.getElementById('accountWelcome');
        const email = document.getElementById('accountEmail');
        const user = getCurrentUser();

        if (triggerGroup) {
            triggerGroup.classList.toggle('account-trigger-group--signed-in', Boolean(user));
        }

        if (trigger) {
            trigger.textContent = user ? `Hi, ${user.name.split(' ')[0]}` : 'Sign In';
        }

        if (!forms || !summary) {
            return;
        }

        if (user) {
            forms.hidden = true;
            summary.hidden = false;
            welcome.textContent = `Welcome back, ${user.name}!`;
            email.textContent = user.email;
            renderActivityList(user);
        } else {
            forms.hidden = false;
            summary.hidden = true;
        }
    };

    const openModal = (mode = 'signin') => {
        const modal = ensureModal();
        updateAccountView();

        if (modal.dataset.accountReady === 'true') {
            const tabButton = modal.querySelector(`[data-account-switch="${mode}"]`);
            tabButton?.click();
        }

        modal.setAttribute('data-open', 'true');
        document.body.classList.add('account-modal-open');
    };

    const closeModal = () => {
        const modal = document.getElementById('accountModal');
        if (!modal) {
            return;
        }

        modal.removeAttribute('data-open');
        document.body.classList.remove('account-modal-open');
    };

    const recordActivity = (activity) => {
        if (!activity || !activity.type) {
            return;
        }

        const currentUser = getCurrentUser();
        if (!currentUser) {
            return;
        }

        const users = getUsers();
        const index = users.findIndex((entry) => entry.email === currentUser.email);

        if (index === -1) {
            return;
        }

        const entry = {
            ...activity,
            timestamp: new Date().toISOString()
        };

        const existing = users[index].activities || [];
        existing.push(entry);
        users[index].activities = existing.slice(-20);

        saveUsers(users);
        setCurrentUser(users[index]);
        renderActivityList(users[index]);
    };

    document.addEventListener('DOMContentLoaded', () => {
        ensureNavTrigger();
        ensureModal();
        updateAccountView();

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeModal();
            }
        });
    });

    window.recordUserActivity = (activity) => {
        recordActivity(activity);
    };

    window.apmAuth = {
        getCurrentUser,
        recordActivity,
        signOut: () => {
            setCurrentUser(null);
            updateAccountView();
        }
    };
})();
