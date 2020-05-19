# azure-ribbon-api

响应结构：

```
{
	"code": 1,
	"message": "",
	"data": {}
}

```

code:

```
-1 响应失败
 1 响应正常 
 2 token过期/登录过期
 3 系统错误信息，前端不显示(统一返回到 message)
 4 错误信息，前端显示的(统一返回到 message)
```

任务分配：


- 王秀文

```
    运营区域管理
    学校管理
    医生管理
    小屋管理
    小屋工作人员管理
```

- 白鹏

```
    内容管理
    用户中心
    定义错误码
```

- 张伯伟

```
    体检项目管理
    调查问卷管理
    优惠券管理
```

- 李辰明

```
    资源中心
    权限中心
    元数据中心
    干预方案管理
```


SLB:

```

通过X-Forwarded-For头字段获取客户端真实 IP
通过SLB-ID头字段获取SLB实例ID。
通过SLB-IP头字段获取SLB实例公网IP地址。
通过X-Forwarded-Proto头字段获取SLB的监听协议
```


未使用的模块：

```
koa-swagger-decorator
```

参考链接：

<http://maples7.com/2016/09/06/build-doc-system-of-express-api-server-with-swagger/>


consul:

```
ACL: 访问控制
Agent: 检查/服务注册
Health: 健康信息获取
Catalog: 目录列表
KV: 键值对存取
Event: 发送事件与列表
Query: 查询服务信息
Status: Raft一致性的状态信息
```


```
dig @127.0.0.1 -p 8600 azure-ribbon.small-program.azure-ribbon-api.service.consul
dig @127.0.0.1 -p 8600 azure-ribbon.small-program.azure-ribbon-api.service.consul SRV
curl http://localhost:8500/v1/catalog/service/azure-ribbon.small-program.azure-ribbon-api | python -m json.tool
curl http://localhost:8500/v1/health/service/azure-ribbon.small-program.azure-ribbon-api?passing | python -m json.tool
```