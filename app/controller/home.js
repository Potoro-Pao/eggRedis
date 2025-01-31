const { Controller } = require('egg');


class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    await this.app.redis.set('foo', 'Guten Tag! Eier!');
    const text = await this.app.redis.get('foo');
    await this.app.redis.set('eggImage', 'https://m.media-amazon.com/images/S/pv-target-images/bcb4a57a7130a75dbd8feafda8d3ee03c7c1dd388c39f650ed5f13cf52acaa1b.jpg');
    const eggImage = await this.app.redis.get('eggImage');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>My Page</title>
        </head>
        <body>
          <p>${text}</p>
          <img style = "width: 300px; height: 270 px;" src="${eggImage}" alt="Egg Image">
        </body>
      </html>
    `;
    ctx.body = html;
  }
}

module.exports = HomeController;
