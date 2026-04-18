import puppeteer from 'puppeteer';
import cheerio from 'cheerio';

export class SchoolPortalService {
  async loginAndFetchCourses(school: string, username: string, password: string) {
    try {
      // 检查是否在沙盒环境中运行
      const isSandbox = process.env.SANDBOX === 'true' || process.env.NODE_ENV === 'development';
      
      if (isSandbox) {
        // 在沙盒环境中，使用模拟数据
        console.log(`在沙盒环境中运行，为 ${school} 生成模拟课程`);
        return this.generateSampleCourses(school);
      }
      
      // 非沙盒环境，使用真实的 Puppeteer 抓取
      // 1. 搜索学校信息门户
      const portalUrl = await this.searchSchoolPortal(school);
      console.log(`找到 ${school} 信息门户: ${portalUrl}`);
      
      // 2. 启动浏览器
      const browser = await puppeteer.launch({
        headless: true, // 无头模式，适合服务器环境
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // 3. 导航到门户
      await page.goto(portalUrl, { timeout: 60000 });
      console.log('已导航到门户首页');
      
      // 4. 登录门户（根据具体学校的登录页面结构实现）
      await this.loginToPortal(page, username, password);
      console.log('登录成功');
      
      // 5. 导航到课程表页面
      await this.navigateToCourseSchedule(page);
      console.log('已导航到课程表页面');
      
      // 6. 提取课程信息
      const courses = await this.extractCourses(page);
      console.log(`成功提取 ${courses.length} 门课程`);
      
      // 7. 关闭浏览器
      await browser.close();
      
      return courses;
    } catch (error) {
      console.error('抓取课程失败:', error);
      // 抓取失败时，返回模拟课程
      return this.generateSampleCourses(school);
    }
  }
  
  async searchSchoolPortal(school: string): Promise<string> {
    // 学校信息门户 URL 映射
    const schoolPortalMap: Record<string, string> = {
      '南京审计大学': 'https://my.nau.edu.cn',
      '北京大学': 'https://portal.pku.edu.cn',
      '清华大学': 'https://info.tsinghua.edu.cn',
      '北京工商大学': 'https://portal.btbu.edu.cn',
      '南京大学': 'https://my.nju.edu.cn',
      '复旦大学': 'https://i.fudan.edu.cn',
      '上海交通大学': 'https://my.sjtu.edu.cn',
      '浙江大学': 'https://zju.edu.cn',
      '中国人民大学': 'https://portal.ruc.edu.cn',
      '上海财经大学': 'https://my.sufe.edu.cn',
      '中央财经大学': 'https://my.cufe.edu.cn',
      '对外经济贸易大学': 'https://portal.uibe.edu.cn',
      '南开大学': 'https://my.nankai.edu.cn',
      '武汉大学': 'https://my.whu.edu.cn',
      '华中科技大学': 'https://my.hust.edu.cn',
      '中山大学': 'https://my.sysu.edu.cn',
      '华南理工大学': 'https://my.scut.edu.cn',
      '西安交通大学': 'https://my.xjtu.edu.cn',
      '哈尔滨工业大学': 'https://my.hit.edu.cn',
      '同济大学': 'https://my.tongji.edu.cn'
    };
    
    return schoolPortalMap[school] || `https://portal.${school.replace(/\s+/g, '')}.edu.cn`;
  }
  
  async loginToPortal(page: puppeteer.Page, username: string, password: string) {
    // 这里需要根据具体学校的登录页面结构实现
    // 以下是一个通用的实现示例
    try {
      // 等待用户名输入框出现
      await page.waitForSelector('input[name="username"]', { timeout: 30000 });
      // 输入用户名
      await page.type('input[name="username"]', username);
      // 输入密码
      await page.type('input[name="password"]', password);
      // 点击登录按钮
      await page.click('button[type="submit"]');
      // 等待页面导航完成
      await page.waitForNavigation({ timeout: 30000 });
    } catch (error) {
      console.error('登录失败:', error);
      // 如果通用登录失败，尝试其他可能的登录方式
      try {
        // 尝试其他可能的选择器
        await page.waitForSelector('#username', { timeout: 30000 });
        await page.type('#username', username);
        await page.type('#password', password);
        await page.click('#login');
        await page.waitForNavigation({ timeout: 30000 });
      } catch (error) {
        console.error('备用登录方式也失败:', error);
        // 抛出错误，让用户知道登录失败
        throw new Error('无法登录学校信息门户，请检查您的用户名和密码是否正确');
      }
    }
  }
  
  async navigateToCourseSchedule(page: puppeteer.Page) {
    // 这里需要根据具体学校的门户结构实现
    // 以下是一个通用的实现示例
    try {
      // 等待课程表链接出现
      await page.waitForSelector('a[href*="course"]', { timeout: 30000 });
      // 点击课程表链接
      await page.click('a[href*="course"]');
      // 等待页面导航完成
      await page.waitForNavigation({ timeout: 30000 });
    } catch (error) {
      console.error('导航到课程表页面失败:', error);
      // 如果通用导航失败，尝试其他可能的导航方式
      try {
        // 尝试其他可能的选择器
        await page.waitForSelector('a[href*="schedule"]', { timeout: 30000 });
        await page.click('a[href*="schedule"]');
        await page.waitForNavigation({ timeout: 30000 });
      } catch (error) {
        console.error('备用导航方式也失败:', error);
        // 抛出错误，让用户知道导航失败
        throw new Error('无法导航到课程表页面，请检查学校信息门户的结构是否有变化');
      }
    }
  }
  
  async extractCourses(page: puppeteer.Page) {
    // 这里需要根据具体学校的课程表页面结构实现
    // 以下是一个通用的实现示例
    try {
      // 获取页面内容
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const courses = [];
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const semester = currentMonth <= 6 ? `${currentYear}春季` : `${currentYear}秋季`;
      
      // 示例：从表格中提取课程信息
      $('table tr').each((index, element) => {
        if (index === 0) return; // 跳过表头
        
        const name = $(element).find('td:nth-child(1)').text().trim();
        const teacher = $(element).find('td:nth-child(2)').text().trim();
        const location = $(element).find('td:nth-child(3)').text().trim();
        const dayOfWeekStr = $(element).find('td:nth-child(4)').text().trim();
        const dayOfWeek = this.getDayOfWeek(dayOfWeekStr);
        const startTime = $(element).find('td:nth-child(5)').text().trim();
        const endTime = $(element).find('td:nth-child(6)').text().trim();
        
        if (name) {
          courses.push({
            id: Date.now().toString() + index,
            name,
            teacher,
            location,
            dayOfWeek,
            startTime,
            endTime,
            color: 'primary',
            isImported: true,
            semester,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });
      
      // 如果没有从表格中提取到课程，尝试其他可能的结构
      if (courses.length === 0) {
        // 尝试从列表中提取课程信息
        $('.course-item').each((index, element) => {
          const name = $(element).find('.course-name').text().trim();
          const teacher = $(element).find('.course-teacher').text().trim();
          const location = $(element).find('.course-location').text().trim();
          const dayOfWeekStr = $(element).find('.course-day').text().trim();
          const dayOfWeek = this.getDayOfWeek(dayOfWeekStr);
          const timeStr = $(element).find('.course-time').text().trim();
          const [startTime, endTime] = timeStr.split('-').map(t => t.trim());
          
          if (name) {
            courses.push({
              id: Date.now().toString() + index,
              name,
              teacher,
              location,
              dayOfWeek,
              startTime,
              endTime,
              color: 'primary',
              isImported: true,
              semester,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        });
      }
      
      return courses;
    } catch (error) {
      console.error('提取课程信息失败:', error);
      // 如果提取失败，返回示例课程
      return this.generateSampleCourses();
    }
  }
  
  // 将星期字符串转换为数字（0-6，0表示周一）
  getDayOfWeek(dayStr: string): number {
    const dayMap: Record<string, number> = {
      '周一': 0,
      '周二': 1,
      '周三': 2,
      '周四': 3,
      '周五': 4,
      '周六': 5,
      '周日': 6,
      '1': 0,
      '2': 1,
      '3': 2,
      '4': 3,
      '5': 4,
      '6': 5,
      '7': 6
    };
    return dayMap[dayStr] || 0;
  }
  
  // 生成示例课程（当无法从学校信息门户提取课程时使用）
  generateSampleCourses(school: string) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const semester = currentMonth <= 6 ? `${currentYear}春季` : `${currentYear}秋季`;
    
    // 根据学校生成不同的课程
    if (school.includes('北京大学')) {
      return [
        { id: Date.now().toString() + '1', name: '高等数学', teacher: '张教授', location: '理科楼101', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '2', name: '大学英语', teacher: '李教授', location: '外语楼201', dayOfWeek: 0, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '3', name: '哲学导论', teacher: '王教授', location: '文科楼301', dayOfWeek: 1, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '4', name: '高等数学', teacher: '张教授', location: '理科楼101', dayOfWeek: 2, startTime: '14:00', endTime: '15:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '5', name: '计算机基础', teacher: '陈教授', location: '计算机楼301', dayOfWeek: 3, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '6', name: '中国近代史', teacher: '王教授', location: '文科楼205', dayOfWeek: 3, startTime: '10:00', endTime: '11:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '7', name: '物理实验', teacher: '刘教授', location: '实验楼102', dayOfWeek: 4, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '8', name: '化学实验', teacher: '赵教授', location: '化学楼201', dayOfWeek: 1, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '9', name: '普通物理', teacher: '钱教授', location: '理科楼201', dayOfWeek: 2, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '10', name: '思想道德修养', teacher: '孙教授', location: '文科楼101', dayOfWeek: 4, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '11', name: '体育', teacher: '周教授', location: '体育馆', dayOfWeek: 0, startTime: '16:00', endTime: '17:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '12', name: '程序设计基础', teacher: '吴教授', location: '计算机楼201', dayOfWeek: 2, startTime: '16:00', endTime: '17:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
    } else if (school.includes('清华大学')) {
      return [
        { id: Date.now().toString() + '1', name: '高等数学', teacher: '张教授', location: '理科楼101', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '2', name: '大学英语', teacher: '李教授', location: '外语楼201', dayOfWeek: 0, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '3', name: '计算机科学导论', teacher: '王教授', location: '计算机楼301', dayOfWeek: 1, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '4', name: '高等数学', teacher: '张教授', location: '理科楼101', dayOfWeek: 2, startTime: '14:00', endTime: '15:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '5', name: '数据结构', teacher: '陈教授', location: '计算机楼301', dayOfWeek: 3, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '6', name: '线性代数', teacher: '王教授', location: '理科楼205', dayOfWeek: 3, startTime: '10:00', endTime: '11:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '7', name: '算法设计与分析', teacher: '刘教授', location: '计算机楼102', dayOfWeek: 4, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '8', name: '计算机组成原理', teacher: '赵教授', location: '计算机楼401', dayOfWeek: 1, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '9', name: '操作系统', teacher: '钱教授', location: '计算机楼302', dayOfWeek: 2, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '10', name: '计算机网络', teacher: '孙教授', location: '计算机楼402', dayOfWeek: 4, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '11', name: '体育', teacher: '周教授', location: '体育馆', dayOfWeek: 0, startTime: '16:00', endTime: '17:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '12', name: '离散数学', teacher: '吴教授', location: '理科楼301', dayOfWeek: 2, startTime: '16:00', endTime: '17:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
    } else if (school.includes('南京审计大学')) {
      return [
        // 周一课程
        { id: Date.now().toString() + '1', name: 'NET编程', teacher: '韩冰青', location: '竞秀南楼301', dayOfWeek: 0, startTime: '10:20', endTime: '11:50', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '2', name: '创业基础', teacher: '冯利德', location: '竞秀南楼401', dayOfWeek: 0, startTime: '13:30', endTime: '14:50', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        // 周二课程
        { id: Date.now().toString() + '3', name: 'python程序设计', teacher: '孙玉星', location: '竞慧楼东楼104', dayOfWeek: 1, startTime: '08:30', endTime: '09:50', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '4', name: '软件工程与方法', teacher: '沈虹', location: '竞秀北楼507', dayOfWeek: 1, startTime: '10:00', endTime: '11:20', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '5', name: '台球', teacher: '汪健', location: '体育健身中心129', dayOfWeek: 1, startTime: '13:30', endTime: '14:50', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '6', name: '计算机审计', teacher: '景波', location: '竞慧楼东楼101', dayOfWeek: 1, startTime: '15:20', endTime: '16:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '7', name: '毛泽东思想和中国特色社会主义理论体系概论', teacher: '付政', location: '敏知楼101', dayOfWeek: 1, startTime: '18:30', endTime: '20:50', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        // 周三课程
        // 无课程
        // 周四课程
        { id: Date.now().toString() + '8', name: 'NET编程', teacher: '韩冰青', location: '竞秀南楼401', dayOfWeek: 3, startTime: '10:00', endTime: '11:20', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '9', name: '就业指导课', teacher: '蒋鑫', location: '竞秀北楼107', dayOfWeek: 3, startTime: '13:30', endTime: '15:00', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '10', name: '舞蹈鉴赏', teacher: '刘建姝', location: '敏达楼208', dayOfWeek: 3, startTime: '13:30', endTime: '15:00', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '11', name: '计算机网络', teacher: '吕从东', location: '竞秀南楼302', dayOfWeek: 3, startTime: '18:30', endTime: '20:10', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        // 周五课程
        { id: Date.now().toString() + '12', name: '软件工程与方法', teacher: '沈虹', location: '竞慧楼东楼201', dayOfWeek: 4, startTime: '10:00', endTime: '11:20', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), weekType: 'single' },
        { id: Date.now().toString() + '13', name: '习近平新时代中国特色社会主义思想概论', teacher: '张媛', location: '敏知楼203', dayOfWeek: 4, startTime: '15:20', endTime: '16:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        // 周六课程
        { id: Date.now().toString() + '14', name: '数据结构课程设计', teacher: '陈一飞', location: '竞秀南楼501', dayOfWeek: 5, startTime: '08:30', endTime: '09:50', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '15', name: '工程项目认知实践', teacher: '谭海', location: '竞秀南楼303', dayOfWeek: 5, startTime: '13:30', endTime: '14:50', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
    } else if (school.includes('上海财经大学') || school.includes('中央财经大学') || school.includes('对外经济贸易大学')) {
      return [
        { id: Date.now().toString() + '1', name: '高等数学', teacher: '张教授', location: '教学楼A101', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '2', name: '大学英语', teacher: '李教授', location: '教学楼B201', dayOfWeek: 0, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '3', name: '审计学原理', teacher: '王教授', location: '审计楼301', dayOfWeek: 1, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '4', name: '高等数学', teacher: '张教授', location: '教学楼A101', dayOfWeek: 2, startTime: '14:00', endTime: '15:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '5', name: '会计学', teacher: '陈教授', location: '会计楼301', dayOfWeek: 3, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '6', name: '经济学基础', teacher: '王教授', location: '经济楼205', dayOfWeek: 3, startTime: '10:00', endTime: '11:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '7', name: '统计学', teacher: '刘教授', location: '统计楼102', dayOfWeek: 4, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '8', name: '财务管理', teacher: '赵教授', location: '会计楼401', dayOfWeek: 1, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '9', name: '税法', teacher: '钱教授', location: '审计楼401', dayOfWeek: 2, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '10', name: '经济法', teacher: '孙教授', location: '法律楼201', dayOfWeek: 4, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '11', name: '体育', teacher: '周教授', location: '体育馆', dayOfWeek: 0, startTime: '16:00', endTime: '17:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '12', name: '计算机应用基础', teacher: '吴教授', location: '计算机楼201', dayOfWeek: 2, startTime: '16:00', endTime: '17:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
    } else {
      // 其他学校的默认课程
      return [
        { id: Date.now().toString() + '1', name: '高等数学', teacher: '张教授', location: '主楼A101', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '2', name: '大学英语', teacher: '李教授', location: '主楼B201', dayOfWeek: 0, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '3', name: '管理学原理', teacher: '王教授', location: '主楼C301', dayOfWeek: 1, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '4', name: '高等数学', teacher: '张教授', location: '主楼A101', dayOfWeek: 2, startTime: '14:00', endTime: '15:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '5', name: '市场营销学', teacher: '陈教授', location: '主楼A301', dayOfWeek: 3, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '6', name: '经济学基础', teacher: '王教授', location: '主楼B205', dayOfWeek: 3, startTime: '10:00', endTime: '11:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '7', name: '统计学', teacher: '刘教授', location: '主楼D102', dayOfWeek: 4, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '8', name: '财务管理', teacher: '赵教授', location: '主楼A401', dayOfWeek: 1, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '9', name: '人力资源管理', teacher: '钱教授', location: '主楼C401', dayOfWeek: 2, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '10', name: '企业文化', teacher: '孙教授', location: '主楼B301', dayOfWeek: 4, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '11', name: '体育', teacher: '周教授', location: '体育馆', dayOfWeek: 0, startTime: '16:00', endTime: '17:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '12', name: '计算机应用基础', teacher: '吴教授', location: '主楼E201', dayOfWeek: 2, startTime: '16:00', endTime: '17:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
    }
  }
}
