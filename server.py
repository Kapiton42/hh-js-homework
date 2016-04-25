import tornado.ioloop
import tornado.web
import tornado.websocket

from tornado.options import define, options, parse_command_line

from json import loads, dumps

define("port", default=8080, type=int)
items = []
listeners = set()
id = 1


class IndexHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("static/list.html")


class ItemsHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        self.write({"data": items})
        self.finish()


class UpdateInformer(tornado.websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True

    def open(self):
        if self not in listeners:
            listeners.add(self)
        global id
        data = {"method": "get", "body": {"elements": items, "id": id}}
        self.ws_connection.write_message(dumps(data))

    def on_message(self, message):
        data = loads(message)
        print(message)
        if data["method"] == "add":
            addItem(data["body"])
        if data["method"] == "swap":
            swapItems(data["body"])

    def on_close(self, message=None):
        if self in listeners:
            listeners.remove(self)


class StaticFileHandler(tornado.web.StaticFileHandler):
    def set_extra_headers(self, path):
        self.set_header('Cache-Control',
                        'no-store, no-cache, must-revalidate, max-age=0')


def sendMessage(message):
    for listener in listeners:
            listener.ws_connection.write_message(dumps(message))


def addItem(item):
    global id
    items.append(item)
    id += 1
    data = {"method": "add", "body": item}
    sendMessage(data)


def swapItems(body):
    first = body["first"]
    second = body["second"]
    items[first], items[second] = items[second], items[first]

    data = {"method": "swap", "body": {"first": first, "second": second}}
    sendMessage(data)


def clearItems():
    data = {"method": "clear", "body": None}
    sendMessage(data)


app = tornado.web.Application([
    (r'/', IndexHandler),
    (r'/index.html', IndexHandler),
    (r'/items', ItemsHandler),
    (r'/updateinformer', UpdateInformer),
    (r"/static/(.*)", StaticFileHandler, {"path": "static"})
])

if __name__ == '__main__':
    parse_command_line()
    app.listen(options.port)
    try:
        tornado.ioloop.IOLoop.instance().start()
    finally:
        clearItems()
