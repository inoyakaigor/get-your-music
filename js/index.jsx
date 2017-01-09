window.ee = new EventEmitter();

var App = React.createClass({
	getInitialState: function() {
		return {
			loggined: false,
			userinfo: {}
		};
	},
	componentWillReceiveProps: function(nextProps) {
		console.log('nextProps', nextProps);
	},
	onLoginClick: function(e) {
		e.preventDefault();
		VK.Auth.login(function(data) {
			if(data.status == "connected") {
					this.setState({loggined: true,
												userinfo: {
													id: data.session.user.id*1,
													url: data.session.user.domain,
													firstName: data.session.user.first_name,
													lastName: data.session.user.last_name,
												}
											});
			} else {
				console.warn('Not authorized', data);
			}
		}.bind(this), 8200);
	},
	render: function() {
		if (this.state.loggined) {
			return (
							<div>
								<Userinfo userinfo={this.state.userinfo}/>
								<Wall userId={this.state.userinfo.id}/>
							</div>
			);
		} else {
			return (
				<a href="#" className="userlogin" onClick={this.onLoginClick}>
					Войти
				</a>
			);
		}
	}
});

ReactDOM.render(
	<App />,
	document.querySelector('#root')
);

var Userinfo = React.createClass({
	getInitialState: function() {
		return {
			userinfo: this.props.userinfo
		}
	},
	componentDidMount: function() {
		VK.Api.call('users.get', {user_ids: 5643035, fields: 'photo_100'}, function(r) {
									var userinfo = this.state.userinfo;
									userinfo.avatar = r.response[0].photo_100;
									this.setState({ userinfo: userinfo });
								}.bind(this));
	},
	render: function() {
		var userinfo = this.state.userinfo;
		return (
			<aside className="userinfo">
				<img src={userinfo.avatar}/>
				<a href={"http://vk.com/" + userinfo.url} target="_blank">
					{userinfo.firstName}
					<br/>
					{userinfo.lastName}
				</a>
			</aside>
		);
	}
});

var Wall = React.createClass({
	getInitialState: function() {
		return {
			userId: this.props.userId,
			totalPosts: 0,
			wall: []
		};
	},
	componentDidMount: function() {
		VK.Api.call('wall.get', {owner_id: this.state.userId}, function(r) {
			var posts = r.response.filter(function(item) {
				if (item instanceof Object) {
					return true;
				}
			}).filter(function(item) {
				var atts = item.attachments ? item.attachments : null;
				if (atts) {
					atts = atts.filter(function(att) {
										if (att.type == "audio") return true;
									});

					if (atts.length) return true;
				}
			});
			posts.forEach(function(item, i, a) {
				a[i].attachments = item.attachments.filter(function(att) {
															if (att.type == "audio") return true;
														});
			});
			this.setState({totalPosts: r.response[0] || 0, wall: posts || [] });
		}.bind(this));
	},
	render: function() {
		var wallTemplate = this.state.wall.map(function(item, index) {
			return (
				<Post key={index} tracks={item.attachments}/>
			);
		});
		return (
			<main>
				{wallTemplate}
			</main>
		);
	}
});

var Post = React.createClass({
	getInitialState: function() {
		return {
			tracks: this.props.tracks
		}
	},
	render: function() {
		var isEmptyUrl = !!this.state.tracks.filter(function(track) {
			return !track.audio.url;
		}).length;

		var tracks = this.state.tracks.map(function(track, index) {
			return (<Track key={index} track={track.audio} />);
		});
		return(
			<div className={"post " + (isEmptyUrl ? "empty-url" : "")}>
				{tracks}
			</div>
		)
	}
});

var Track = React.createClass({
	render: function() {
		return (
			<div className="track">
				{this.props.track.artist} – {this.props.track.title}<br/>
				<audio src={this.props.track.url} controls preload="none"></audio>
			</div>
		)
	}
});