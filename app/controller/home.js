const { Controller } = require('egg');

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = `${ctx.URL} <br> ${this.ctx.body}`;
  }
}

module.exports = HomeController;
