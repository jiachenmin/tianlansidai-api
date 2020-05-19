const RepositoryModel = require('../../models/repository');


async function update(ctx, next) {

    let payload = ctx.request.body.payload
    payload = JSON.parse(payload)
    if (payload == null) {
        return await next()
    }
    await RepositoryModel.save({
        headers: headers,
        payload: payload
    })
    await next()
}



module.exports = { update }


var headers = {
    "remoteip": "192.30.252.39",
    "host": "api.tianlansidai.com",
    "x-forwarded-for": "192.30.252.39",
    "connection": "close",
    "content-length": "10437",
    "accept": "*/*",
    "user-agent": "GitHub-Hookshot/903858c",
    "x-github-event": "push",
    "x-github-delivery": "150f3e58-54f6-11e9-8b59-cf3ab90618c7",
    "content-type": "application/x-www-form-urlencoded",
    "x-hub-signature": "sha1=043e51b7321b132a03565cd8b5ceea3905fe5182",
    "x-forwarded-proto": "https",
    "slb-ip": "10.0.0.14",
    "slb-id": "lb-uf6xhfr0bsvb5mtp0roq3"
}
 
// "payload": "{\"ref\":\"refs/heads/master\",\"before\":\"eccfee12dff3ce0a9e596ea529f41e1796bd7ac1\",\"after\":\"406c86f528604b9049f631e0d82f5d5f575e8940\",\"created\":false,\"deleted\":false,\"forced\":false,\"base_ref\":null,\"compare\":\"https://github.com/wangxiuwen/azure-ribbon-api/compare/eccfee12dff3...406c86f52860\",\"commits\":[{\"id\":\"406c86f528604b9049f631e0d82f5d5f575e8940\",\"tree_id\":\"5a2f9c70e41dcf4f6f1c98e34a3b509239b43365\",\"distinct\":true,\"message\":\"fix\",\"timestamp\":\"2019-04-02T11:18:53+08:00\",\"url\":\"https://github.com/wangxiuwen/azure-ribbon-api/commit/406c86f528604b9049f631e0d82f5d5f575e8940\",\"author\":{\"name\":\"xiuwen.wang\",\"email\":\"xiuwen.wang@i-driven.com.cn\"},\"committer\":{\"name\":\"xiuwen.wang\",\"email\":\"xiuwen.wang@i-driven.com.cn\"},\"added\":[],\"removed\":[],\"modified\":[\"controllers/console/devops.js\"]}],\"head_commit\":{\"id\":\"406c86f528604b9049f631e0d82f5d5f575e8940\",\"tree_id\":\"5a2f9c70e41dcf4f6f1c98e34a3b509239b43365\",\"distinct\":true,\"message\":\"fix\",\"timestamp\":\"2019-04-02T11:18:53+08:00\",\"url\":\"https://github.com/wangxiuwen/azure-ribbon-api/commit/406c86f528604b9049f631e0d82f5d5f575e8940\",\"author\":{\"name\":\"xiuwen.wang\",\"email\":\"xiuwen.wang@i-driven.com.cn\"},\"committer\":{\"name\":\"xiuwen.wang\",\"email\":\"xiuwen.wang@i-driven.com.cn\"},\"added\":[],\"removed\":[],\"modified\":[\"controllers/console/devops.js\"]},\"repository\":{\"id\":175391407,\"node_id\":\"MDEwOlJlcG9zaXRvcnkxNzUzOTE0MDc=\",\"name\":\"azure-ribbon-api\",\"full_name\":\"wangxiuwen/azure-ribbon-api\",\"private\":true,\"owner\":{\"name\":\"wangxiuwen\",\"email\":\"wangxiuwen@qianrushi.org\",\"login\":\"wangxiuwen\",\"id\":17867124,\"node_id\":\"MDQ6VXNlcjE3ODY3MTI0\",\"avatar_url\":\"https://avatars0.githubusercontent.com/u/17867124?v=4\",\"gravatar_id\":\"\",\"url\":\"https://api.github.com/users/wangxiuwen\",\"html_url\":\"https://github.com/wangxiuwen\",\"followers_url\":\"https://api.github.com/users/wangxiuwen/followers\",\"following_url\":\"https://api.github.com/users/wangxiuwen/following{/other_user}\",\"gists_url\":\"https://api.github.com/users/wangxiuwen/gists{/gist_id}\",\"starred_url\":\"https://api.github.com/users/wangxiuwen/starred{/owner}{/repo}\",\"subscriptions_url\":\"https://api.github.com/users/wangxiuwen/subscriptions\",\"organizations_url\":\"https://api.github.com/users/wangxiuwen/orgs\",\"repos_url\":\"https://api.github.com/users/wangxiuwen/repos\",\"events_url\":\"https://api.github.com/users/wangxiuwen/events{/privacy}\",\"received_events_url\":\"https://api.github.com/users/wangxiuwen/received_events\",\"type\":\"User\",\"site_admin\":false},\"html_url\":\"https://github.com/wangxiuwen/azure-ribbon-api\",\"description\":null,\"fork\":false,\"url\":\"https://github.com/wangxiuwen/azure-ribbon-api\",\"forks_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/forks\",\"keys_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/keys{/key_id}\",\"collaborators_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/collaborators{/collaborator}\",\"teams_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/teams\",\"hooks_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/hooks\",\"issue_events_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/issues/events{/number}\",\"events_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/events\",\"assignees_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/assignees{/user}\",\"branches_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/branches{/branch}\",\"tags_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/tags\",\"blobs_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/git/blobs{/sha}\",\"git_tags_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/git/tags{/sha}\",\"git_refs_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/git/refs{/sha}\",\"trees_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/git/trees{/sha}\",\"statuses_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/statuses/{sha}\",\"languages_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/languages\",\"stargazers_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/stargazers\",\"contributors_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/contributors\",\"subscribers_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/subscribers\",\"subscription_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/subscription\",\"commits_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/commits{/sha}\",\"git_commits_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/git/commits{/sha}\",\"comments_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/comments{/number}\",\"issue_comment_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/issues/comments{/number}\",\"contents_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/contents/{+path}\",\"compare_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/compare/{base}...{head}\",\"merges_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/merges\",\"archive_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/{archive_format}{/ref}\",\"downloads_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/downloads\",\"issues_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/issues{/number}\",\"pulls_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/pulls{/number}\",\"milestones_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/milestones{/number}\",\"notifications_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/notifications{?since,all,participating}\",\"labels_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/labels{/name}\",\"releases_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/releases{/id}\",\"deployments_url\":\"https://api.github.com/repos/wangxiuwen/azure-ribbon-api/deployments\",\"created_at\":1552470356,\"updated_at\":\"2019-04-02T03:18:49Z\",\"pushed_at\":1554175150,\"git_url\":\"git://github.com/wangxiuwen/azure-ribbon-api.git\",\"ssh_url\":\"git@github.com:wangxiuwen/azure-ribbon-api.git\",\"clone_url\":\"https://github.com/wangxiuwen/azure-ribbon-api.git\",\"svn_url\":\"https://github.com/wangxiuwen/azure-ribbon-api\",\"homepage\":null,\"size\":473,\"stargazers_count\":0,\"watchers_count\":0,\"language\":\"JavaScript\",\"has_issues\":true,\"has_projects\":true,\"has_downloads\":true,\"has_wiki\":true,\"has_pages\":false,\"forks_count\":0,\"mirror_url\":null,\"archived\":false,\"open_issues_count\":0,\"license\":null,\"forks\":0,\"open_issues\":0,\"watchers\":0,\"default_branch\":\"master\",\"stargazers\":0,\"master_branch\":\"master\"},\"pusher\":{\"name\":\"wangxiuwen\",\"email\":\"wangxiuwen@qianrushi.org\"},\"sender\":{\"login\":\"wangxiuwen\",\"id\":17867124,\"node_id\":\"MDQ6VXNlcjE3ODY3MTI0\",\"avatar_url\":\"https://avatars0.githubusercontent.com/u/17867124?v=4\",\"gravatar_id\":\"\",\"url\":\"https://api.github.com/users/wangxiuwen\",\"html_url\":\"https://github.com/wangxiuwen\",\"followers_url\":\"https://api.github.com/users/wangxiuwen/followers\",\"following_url\":\"https://api.github.com/users/wangxiuwen/following{/other_user}\",\"gists_url\":\"https://api.github.com/users/wangxiuwen/gists{/gist_id}\",\"starred_url\":\"https://api.github.com/users/wangxiuwen/starred{/owner}{/repo}\",\"subscriptions_url\":\"https://api.github.com/users/wangxiuwen/subscriptions\",\"organizations_url\":\"https://api.github.com/users/wangxiuwen/orgs\",\"repos_url\":\"https://api.github.com/users/wangxiuwen/repos\",\"events_url\":\"https://api.github.com/users/wangxiuwen/events{/privacy}\",\"received_events_url\":\"https://api.github.com/users/wangxiuwen/received_events\",\"type\":\"User\",\"site_admin\":false}}"


var payload = {
    "ref": "refs/heads/master",
    "before": "6f5088700609111303ccf503848da82c088de570",
    "after": "144e1bdd6d43948004247689fadba9e3a1048a78",
    "created": false,
    "deleted": false,
    "forced": false,
    "base_ref": null,
    "compare": "https://github.com/wangxiuwen/azure-ribbon-api/compare/6f5088700609...144e1bdd6d43",
    "commits": [
        {
            "id": "144e1bdd6d43948004247689fadba9e3a1048a78",
            "tree_id": "86ba3b5720792541faf8a8c2aa857274d011679e",
            "distinct": true,
            "message": "fix",
            "timestamp": "2019-04-02T11:10:43+08:00",
            "url": "https://github.com/wangxiuwen/azure-ribbon-api/commit/144e1bdd6d43948004247689fadba9e3a1048a78",
            "author": {
                "name": "xiuwen.wang",
                "email": "xiuwen.wang@i-driven.com.cn"
            },
            "committer": {
                "name": "xiuwen.wang",
                "email": "xiuwen.wang@i-driven.com.cn"
            },
            "added": [],
            "removed": [],
            "modified": [
                "controllers/console/devops.js"
            ]
        }
    ],
    "head_commit": {
        "id": "144e1bdd6d43948004247689fadba9e3a1048a78",
        "tree_id": "86ba3b5720792541faf8a8c2aa857274d011679e",
        "distinct": true,
        "message": "fix",
        "timestamp": "2019-04-02T11:10:43+08:00",
        "url": "https://github.com/wangxiuwen/azure-ribbon-api/commit/144e1bdd6d43948004247689fadba9e3a1048a78",
        "author": {
            "name": "xiuwen.wang",
            "email": "xiuwen.wang@i-driven.com.cn"
        },
        "committer": {
            "name": "xiuwen.wang",
            "email": "xiuwen.wang@i-driven.com.cn"
        },
        "added": [],
        "removed": [],
        "modified": [
            "controllers/console/devops.js"
        ]
    },
    "repository": {
        "id": 175391407,
        "node_id": "MDEwOlJlcG9zaXRvcnkxNzUzOTE0MDc=",
        "name": "azure-ribbon-api",
        "full_name": "wangxiuwen/azure-ribbon-api",
        "private": true,
        "owner": {
            "name": "wangxiuwen",
            "email": "wangxiuwen@qianrushi.org",
            "login": "wangxiuwen",
            "id": 17867124,
            "node_id": "MDQ6VXNlcjE3ODY3MTI0",
            "avatar_url": "https://avatars0.githubusercontent.com/u/17867124?v=4",
            "gravatar_id": "",
            "url": "https://api.github.com/users/wangxiuwen",
            "html_url": "https://github.com/wangxiuwen",
            "followers_url": "https://api.github.com/users/wangxiuwen/followers",
            "following_url": "https://api.github.com/users/wangxiuwen/following{/other_user}",
            "gists_url": "https://api.github.com/users/wangxiuwen/gists{/gist_id}",
            "starred_url": "https://api.github.com/users/wangxiuwen/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/wangxiuwen/subscriptions",
            "organizations_url": "https://api.github.com/users/wangxiuwen/orgs",
            "repos_url": "https://api.github.com/users/wangxiuwen/repos",
            "events_url": "https://api.github.com/users/wangxiuwen/events{/privacy}",
            "received_events_url": "https://api.github.com/users/wangxiuwen/received_events",
            "type": "User",
            "site_admin": false
        },
        "html_url": "https://github.com/wangxiuwen/azure-ribbon-api",
        "description": null,
        "fork": false,
        "url": "https://github.com/wangxiuwen/azure-ribbon-api",
        "forks_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/forks",
        "keys_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/keys{/key_id}",
        "collaborators_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/collaborators{/collaborator}",
        "teams_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/teams",
        "hooks_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/hooks",
        "issue_events_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/issues/events{/number}",
        "events_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/events",
        "assignees_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/assignees{/user}",
        "branches_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/branches{/branch}",
        "tags_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/tags",
        "blobs_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/git/blobs{/sha}",
        "git_tags_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/git/tags{/sha}",
        "git_refs_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/git/refs{/sha}",
        "trees_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/git/trees{/sha}",
        "statuses_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/statuses/{sha}",
        "languages_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/languages",
        "stargazers_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/stargazers",
        "contributors_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/contributors",
        "subscribers_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/subscribers",
        "subscription_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/subscription",
        "commits_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/commits{/sha}",
        "git_commits_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/git/commits{/sha}",
        "comments_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/comments{/number}",
        "issue_comment_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/issues/comments{/number}",
        "contents_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/contents/{+path}",
        "compare_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/compare/{base}...{head}",
        "merges_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/merges",
        "archive_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/{archive_format}{/ref}",
        "downloads_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/downloads",
        "issues_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/issues{/number}",
        "pulls_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/pulls{/number}",
        "milestones_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/milestones{/number}",
        "notifications_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/notifications{?since,all,participating}",
        "labels_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/labels{/name}",
        "releases_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/releases{/id}",
        "deployments_url": "https://api.github.com/repos/wangxiuwen/azure-ribbon-api/deployments",
        "created_at": 1552470356,
        "updated_at": "2019-04-02T03:10:03Z",
        "pushed_at": 1554174652,
        "git_url": "git://github.com/wangxiuwen/azure-ribbon-api.git",
        "ssh_url": "git@github.com:wangxiuwen/azure-ribbon-api.git",
        "clone_url": "https://github.com/wangxiuwen/azure-ribbon-api.git",
        "svn_url": "https://github.com/wangxiuwen/azure-ribbon-api",
        "homepage": null,
        "size": 445,
        "stargazers_count": 0,
        "watchers_count": 0,
        "language": "JavaScript",
        "has_issues": true,
        "has_projects": true,
        "has_downloads": true,
        "has_wiki": true,
        "has_pages": false,
        "forks_count": 0,
        "mirror_url": null,
        "archived": false,
        "open_issues_count": 0,
        "license": null,
        "forks": 0,
        "open_issues": 0,
        "watchers": 0,
        "default_branch": "master",
        "stargazers": 0,
        "master_branch": "master"
    },
    "pusher": {
        "name": "wangxiuwen",
        "email": "wangxiuwen@qianrushi.org"
    },
    "sender": {
        "login": "wangxiuwen",
        "id": 17867124,
        "node_id": "MDQ6VXNlcjE3ODY3MTI0",
        "avatar_url": "https://avatars0.githubusercontent.com/u/17867124?v=4",
        "gravatar_id": "",
        "url": "https://api.github.com/users/wangxiuwen",
        "html_url": "https://github.com/wangxiuwen",
        "followers_url": "https://api.github.com/users/wangxiuwen/followers",
        "following_url": "https://api.github.com/users/wangxiuwen/following{/other_user}",
        "gists_url": "https://api.github.com/users/wangxiuwen/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/wangxiuwen/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/wangxiuwen/subscriptions",
        "organizations_url": "https://api.github.com/users/wangxiuwen/orgs",
        "repos_url": "https://api.github.com/users/wangxiuwen/repos",
        "events_url": "https://api.github.com/users/wangxiuwen/events{/privacy}",
        "received_events_url": "https://api.github.com/users/wangxiuwen/received_events",
        "type": "User",
        "site_admin": false
    }
} 