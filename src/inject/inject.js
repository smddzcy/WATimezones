class Users {
	static setTimezone(userId, timezone) {
		return new Promise((resolve, reject) => {
			Users.getUsers().then((users) => {
				users[userId] = users[userId] || {};
				users[userId].timezone = timezone;
				console.info(`Setting timezone for ${userId} to ${timezone}`);
				chrome.storage.sync.set({
					users: users
				}, () => {
					if (chrome.runtime.lastError !== undefined) {
						console.error("Error while setting timezone:", chrome.runtime.lastError);
						reject(chrome.runtime.lastError);
					} else {
						resolve();
					}
				});
			}).catch(reject);
		});
	};

	static getUsers() {
		return new Promise((resolve, reject) => {
			chrome.storage.sync.get(['users'], (result) => {
				if (chrome.runtime.lastError !== undefined) {
					console.error("Error while getting user data:", chrome.runtime.lastError);
					reject(chrome.runtime.lastError);
				} else {
					resolve(result.users || {});
				}
			})
		});
	};

	static removeUser(userId) {
		return new Promise((resolve, reject) => {
			Users.getUsers().then((users) => {
				delete users[userId];
				chrome.storage.sync.set({
					users: users
				}, () => {
					if (chrome.runtime.lastError !== undefined) {
						console.error("Error while removing user data:", chrome.runtime.lastError);
						reject(chrome.runtime.lastError);
					} else {
						resolve();
					}
				});
			}).catch(reject);
		});
	};
}

class Chats {
	static _getSidePanel() {
		return this._sidePanel || document.getElementById('pane-side');
	}

	static isLoaded() {
		return !!this._getSidePanel();
	}

	static updateChats() {
		this.removeTextIntervals = this.removeTextIntervals || {};
		if (!this.isLoaded()) return;
		const chatsWrapper = this._getSidePanel().firstChild.firstChild.firstChild;
		const chatElements = Array.from(chatsWrapper.children).map(el => el.firstChild.firstChild);
		const getUserIdFromElement = (el) => ((el.querySelector('img') || {src:''}).src.match(/&u=(.*?)(%|@)/) || [])[1];
		// console.log("Updating times.");

		const _getTimeInTimezone = (timezoneOffset) => {
			const date = new Date();
			const utcDate = date.getTime() + (date.getTimezoneOffset() * 60000);
			const dateInTimezone = new Date(utcDate + (3600000 * timezoneOffset));
			return dateInTimezone;
		};

		Users.getUsers().then(users => {
			chatElements.forEach((el) => {
				const userId = getUserIdFromElement(el);
				if (!userId) return; // TODO: Find a way to get ids of users with no photos

				// insert the "set timezone button" whenever user opens a new chat window
				el.onclick = ((el, userId) => () => {
					let mainDiv;
					const waitForChatWindow = setInterval(() => {
						mainDiv = document.getElementById('main');
						if (mainDiv) {
							// Chat window is mounted
							clearInterval(waitForChatWindow);
							// console.log("Chat window opened.");
							const headerButtonsWrapper = mainDiv.querySelector('header').lastChild.firstChild;
							if (headerButtonsWrapper.querySelector('#watimezones-settimezone')) return; // there's already a set timezone button

							const button = headerButtonsWrapper.firstChild.cloneNode(false);
							button.innerHTML = `<div role="button" title="Set timezone"><svg viewBox="0 0 612.029 612.029" style="fill:#263238;opacity:0.5;width: 20px;height: 20px;margin: 2px 0 0 2px;"><path d="M470.128 328.236c-78.368 0-141.906 63.538-141.906 141.887 0 78.368 63.538 141.906 141.906 141.906 78.349 0 141.887-63.538 141.887-141.906 0-78.349-63.538-141.887-141.887-141.887zm9.123 246.794v-12.274c0-5.044-4.079-9.142-9.123-9.142a9.136 9.136 0 0 0-9.143 9.142v12.274c-50.814-4.391-91.394-44.97-95.765-95.765h12.274c5.044 0 9.142-4.099 9.142-9.143 0-5.063-4.098-9.123-9.142-9.123H365.22c4.371-50.814 44.95-91.403 95.765-95.784v12.293a9.136 9.136 0 0 0 9.143 9.143c5.044 0 9.123-4.098 9.123-9.143v-12.293c50.814 4.391 91.413 44.97 95.765 95.784h-12.274a9.108 9.108 0 0 0-9.142 9.123 9.136 9.136 0 0 0 9.142 9.143h12.274c-4.352 50.805-44.951 91.384-95.765 95.765z"></path><path d="M523.001 456.434h-32.92c-4.371-6.352-11.66-10.527-19.953-10.527-.137 0-.254.039-.4.039l-30.003-42.219c-4.361-6.157-12.908-7.581-19.084-3.229-6.157 4.391-7.621 12.947-3.23 19.104l30.013 42.257c-.927 2.596-1.521 5.367-1.521 8.274 0 13.396 10.83 24.227 24.227 24.227 8.293 0 15.602-4.156 19.953-10.527h32.92c7.562 0 13.699-6.118 13.699-13.699s-6.14-13.7-13.701-13.7zM419.44 87.726l-23.993-21.534-28.285-5.523-.654 12.938 27.729 27.066 13.562 15.973-15.279 7.971-12.431-3.668-18.587-7.786.634-14.987-24.412-10.06-8.117 35.271-24.588 5.581 2.439 19.661 32.022 6.176 5.522-31.418 26.48 3.903 12.274 7.22h19.777l13.484 27.037 35.848 36.335-2.635 14.148-28.881-3.708-49.868 25.242-35.965 43.058-4.653 19.085h-12.909l-24.031-11.094-23.339 11.094 5.834 24.617 10.138-11.708 17.836-.547-1.229 22.09 14.801 4.332 14.782 16.606 20.051-5.62c30.705-28.93 71.948-46.794 117.357-46.794 50.239 0 95.346 21.846 126.725 56.396 3.21-17.582 4.966-35.662 4.966-54.171 0-61.957-18.782-119.592-50.932-167.45l-8.986 2.869-47.985 4.264-13.542 21.631-9.797-3.132-38.159-34.394-5.562-17.895-7.442-19.075z"></path><path d="M298.667 470.133c0-35.594 10.928-68.689 29.574-96.126l-14.626-4.43-22.587-22.646-50.044-11.221-16.606-34.793v20.675h-7.328l-43.136-58.513v-47.985l-31.632-51.4-50.2 8.957H58.284L41.248 161.48l21.709-17.221-21.631 4.986C15.236 193.815.015 245.547.015 300.908c0 166.182 134.706 300.965 300.897 300.965 12.792 0 25.339-1.093 37.75-2.634l-1.864-21.515c-23.797-29.456-38.131-66.856-38.131-107.591zM111.83 96.985l53.469-7.435 24.626-13.513 27.749 7.991 44.278-2.449 15.182-23.856 22.129 3.649 53.742-5.035 14.811-16.313 20.88-13.943 29.516 4.459 10.771-1.639C390.081 10.586 346.789 0 300.912 0c-93.414 0-176.963 42.57-232.09 109.406h.156l42.852-12.421zm201.785-67.109l30.773-16.899 19.72 11.386-28.588 21.739-27.241 2.732-12.294-7.952 17.63-11.006zm-91.013 2.469l13.543 5.649 17.758-5.649 9.679 16.762-40.99 10.752-19.729-11.523s19.3-12.391 19.739-15.991z"></path></svg></div>`;
							button.id = 'watimezones-settimezone';
							button.onclick = () => {
								const timezone = prompt('Enter timezone:');
								if (timezone === "") {
									Users.removeUser(userId).then(() => {});
								} else if (!Number.isNaN(Number.parseFloat(timezone))) {
									Users.setTimezone(userId, Number.parseFloat(timezone)).then(() => {});
								}
							};
							headerButtonsWrapper.insertBefore(button, headerButtonsWrapper.firstChild);
						}
					}, 10);
					el.onclick = null;
				})(el, userId);

				const lastMessageTimeWrapper = el.lastChild.firstChild.lastChild;
				const user = users[userId];
				if (!user || !user.timezone) return;

				const localTime = _getTimeInTimezone(user.timezone);
				const localTimeStr = localTime.toLocaleTimeString(undefined, {
					hour: '2-digit',
					minute: '2-digit',
					hour12: false
				});

				
				let localTimeEl = lastMessageTimeWrapper.querySelector(`#watimezones-sidepanel-localtime-${userId}`);
				if (!localTimeEl) {
					// there is no local time element on DOM, insert the element 
					localTimeEl = lastMessageTimeWrapper.firstChild.cloneNode(false);
					localTimeEl.innerText = `(${localTimeStr}) `;
					localTimeEl.id = `watimezones-sidepanel-localtime-${userId}`;
					lastMessageTimeWrapper.insertBefore(localTimeEl, lastMessageTimeWrapper.firstChild);
				} else {
					// update the time
					localTimeEl.innerText = `(${localTimeStr}) `;
					clearInterval(this.removeTextIntervals[userId]);
				}
				this.removeTextIntervals[userId] = setTimeout(() => {
					localTimeEl.parentNode.removeChild(localTimeEl);
				}, 1500);
			});
		});
	}
}

chrome.extension.sendMessage({}, function (response) {
	const readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			const updateChatsInterval = setInterval(Chats.updateChats, 1000);
		}
	}, 10);
});
