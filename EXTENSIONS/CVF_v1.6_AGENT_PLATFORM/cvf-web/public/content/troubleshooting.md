# CVF Troubleshooting Guide

> **🎯 Quick fixes for common CVF issues**

---

## 📋 Table of Contents

- [Setup Issues](#-setup-issues)
- [Web UI Problems](#-web-ui-problems)
- [Version Confusion](#-version-confusion)
- [Skill Errors](#-skill-errors)
- [Governance Issues](#-governance-issues)
- [Performance Problems](#-performance-problems)
- [Common Error Messages](#-common-error-messages)

---

## 🔧 Setup Issues

### Issue: `npm install` fails

**Symptoms:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve
```

**Solutions:**

1. **Check Node.js version:**
   ```bash
   node -v
   # Should be 18.0.0 or higher
   ```
   
   If not, install Node 18+: https://nodejs.org/

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Use legacy peer deps (if still failing):**
   ```bash
   npm install --legacy-peer-deps
   ```

---

### Issue: Permission denied errors

**Symptoms:**
```
EACCES: permission denied
```

**Solutions:**

1. **Don't use sudo with npm** (dangerous)

2. **Fix npm permissions:**
   ```bash
   # Option A: Use nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   
   # Option B: Change npm prefix
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

---

### Issue: Port 3000 already in use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

1. **Find and kill process on port 3000:**
   ```bash
   # On Mac/Linux
   lsof -ti:3000 | xargs kill -9
   
   # On Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Or use different port:**
   ```bash
   # Edit .env file
   PORT=3001
   
   # Or run with custom port
   PORT=3001 npm run dev
   ```

---

### Issue: Git clone fails

**Symptoms:**
```
fatal: repository not found
fatal: could not read Username
```

**Solutions:**

1. **Check URL:**
   ```bash
   # Correct URL
   git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
   ```

2. **Check network/firewall:**
   - Try different network
   - Check corporate firewall settings
   - Use VPN if needed

3. **Use SSH instead:**
   ```bash
   git clone git@github.com:Blackbird081/Controlled-Vibe-Framework-CVF.git
   ```

---

## 🖥️ Web UI Problems

### Issue: Web UI shows blank page

**Symptoms:**
- Browser shows white screen
- Console shows React errors

**Solutions:**

1. **Check build process:**
   ```bash
   npm run build
   # Check for errors
   ```

2. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Win) or `Cmd+Shift+R` (Mac)
   - Or clear cache in DevTools

3. **Check console for errors:**
   - Open DevTools (F12)
   - Look at Console tab
   - Screenshot and report issues

4. **Verify .env file:**
   ```bash
   # .env should have:
   NODE_ENV=development
   PORT=3000
   ```

---

### Issue: Templates not loading

**Symptoms:**
- Template list empty
- "Failed to load templates" error

**Solutions:**

1. **Check file paths:**
   ```bash
   # Templates should be in:
   EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/
   ```

2. **Verify JSON format:**
   - Templates must be valid JSON
   - No trailing commas
   - Proper escaping

3. **Check permissions:**
   ```bash
   # Make sure files are readable
   chmod -R 755 EXTENSIONS/
   ```

---

### Issue: AI providers not working

**Symptoms:**
- "API key invalid" errors
- Responses not coming back

**Solutions:**

1. **Add API keys to .env:**
   ```bash
   # .env file
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_API_KEY=...
   ```

2. **Verify API key format:**
   - OpenAI: starts with `sk-`
   - Anthropic: starts with `sk-ant-`
   - Google: alphanumeric string

3. **Check API quota:**
   - Login to provider dashboard
   - Check usage limits
   - Add billing if needed

4. **Test API key separately:**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

---

### Issue: Dark mode not working

**Symptoms:**
- Theme toggle doesn't switch
- Stuck in light/dark mode

**Solutions:**

1. **Clear localStorage:**
   ```javascript
   // In browser console
   localStorage.clear()
   location.reload()
   ```

2. **Check system preferences:**
   - Web UI respects system theme
   - Change OS theme settings

---

## 🔀 Version Confusion

### Issue: Not sure which version to use

**Solutions:**

1. **Use decision tree:** [Version Picker](version-picker.md)

2. **Quick recommendations:**
   - Solo beginner: **v1.6**
   - Team: **v1.1 + v1.6**
   - Enterprise: **Full stack**

3. **Start simple:**
   - You can always upgrade later
   - v1.6 includes most features

---

### Issue: "This feature requires v1.X"

**Solutions:**

1. **Check current version:**
   ```bash
   cat package.json | grep version
   ```

2. **Upgrade to needed version:**
   ```bash
   git pull origin main
   cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
   npm install
   ```

3. **Or use different features:**
   - See [feature comparison](version-picker.md#comparison-table)

---

## 🧩 Skill Errors

### Issue: Skill validation fails

**Symptoms:**
```
❌ Skill validation failed
Missing required field: risk_level
```

**Solutions:**

1. **Check skill format:**
   ```yaml
   # Required fields
   id: my-skill-v1
   name: My Skill
   version: 1.0.0
   risk_level: R1  # Must be R0, R1, R2, or R3
   category: domain_name
   ```

2. **Use validation tool:**
   ```bash
   cd tools/skill-validation
   python3 validate_skills.py path/to/skill.md
   ```

3. **See example skills:**
   - Check `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/`
   - Copy structure from working skills

---

### Issue: "Skill not found"

**Solutions:**

1. **Check file location:**
   ```bash
   # Skills should be in:
   EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/[category]/
   ```

2. **Check file naming:**
   - Must end with `.skill.md`
   - Example: `email-classifier.skill.md`

3. **Verify skill ID:**
   - ID in file must match filename
   - Use kebab-case

---

### Issue: "Risk level exceeds phase limit"

**Symptoms:**
```
⚠️ Warning: Risk level R3 not allowed in Phase A
```

**Solutions:**

1. **Understand risk model:**
   - Phase A (Discovery): R0-R1 only
   - Phase B (Design): R0-R2
   - Phase C (Build): R0-R3
   - Phase D (Review): R0-R1

2. **Lower risk level or change phase:**
   ```yaml
   # Either:
   risk_level: R1  # Lower risk
   
   # Or use in different phase
   # Move from Phase A to Phase C
   ```

3. **See risk guide:**
   - [Governance Model](../docs/concepts/governance-model.md#risk-model)

---

## 🔐 Governance Issues

### Issue: Phase gates blocking progress

**Symptoms:**
- Can't proceed to next phase
- Checklist not complete

**Solutions:**

1. **Review checklist items:**
   ```bash
   # Check phase gate requirements
   governance/toolkit/01_BOOTSTRAP/phase-gates.md
   ```

2. **Complete missing items:**
   - Each phase has specific requirements
   - Must be checked off before proceeding

3. **Override (if authorized):**
   ```yaml
   # In governance config
   allow_phase_skip: true  # Use with caution!
   ```

---

### Issue: Authority matrix conflicts

**Symptoms:**
- "User not authorized for this role"
- Permission denied errors

**Solutions:**

1. **Check role assignment:**
   ```yaml
   # governance/toolkit/03_CONTROL/authority-matrix.yaml
   roles:
     - user: alice@example.com
       phase: A
       role: Owner
   ```

2. **Verify role for phase:**
   - Phase A: Owner only
   - Phase B: Architect only
   - Phase C: Executor (AI)
   - Phase D: Reviewer only

3. **Request role change:**
   - Contact project admin
   - Update authority matrix

---

## ⚡ Performance Problems

### Issue: Web UI is slow

**Solutions:**

1. **Check system resources:**
   ```bash
   # Make sure you have enough RAM/CPU
   top  # or Activity Monitor on Mac
   ```

2. **Close unnecessary tabs/apps**

3. **Use production build:**
   ```bash
   npm run build
   npm run start  # Instead of dev
   ```

4. **Clear browser data:**
   - Cache
   - Cookies
   - Local storage

---

### Issue: Build takes too long

**Solutions:**

1. **Use faster npm install:**
   ```bash
   npm ci  # Instead of npm install
   ```

2. **Enable caching:**
   ```bash
   npm config set cache ~/.npm-cache
   ```

3. **Use yarn instead:**
   ```bash
   npm install -g yarn
   yarn install  # Faster than npm
   ```

---

## ⚠️ Common Error Messages

### Error: "Module not found"

**Full error:**
```
Error: Cannot find module 'react'
```

**Solution:**
```bash
npm install
# or
npm install react react-dom
```

---

### Error: "Unexpected token <"

**Full error:**
```
SyntaxError: Unexpected token '<'
```

**Causes:**
- Build failed
- Wrong file type

**Solution:**
```bash
# Clear build
rm -rf .next  # or build/
npm run build
```

---

### Error: "fetch is not defined"

**Full error:**
```
ReferenceError: fetch is not defined
```

**Solution:**
```bash
# Node <18, install polyfill
npm install node-fetch

# Or upgrade Node to 18+
nvm install 18
```

---

### Error: "CORS policy blocked"

**Full error:**
```
Access to fetch at '...' has been blocked by CORS policy
```

**Solutions:**

1. **Check API endpoint URL**

2. **Add CORS headers (if API server):**
   ```javascript
   // In API server
   res.setHeader('Access-Control-Allow-Origin', '*')
   ```

3. **Use proxy:**
   ```javascript
   // In package.json
   "proxy": "http://localhost:5000"
   ```

---

## 🆘 Still Need Help?

### Step 1: Search Documentation
- 🔍 [Full docs](../docs/GET_STARTED.md)
- ❓ [FAQ](faq.md)

### Step 2: Check Existing Issues
- 🐛 [GitHub Issues](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues)
- Search for your error message

### Step 3: Ask Community
- 💬 [Discord](https://discord.gg/cvf)
- Usually fastest response

### Step 4: File a Bug Report

**Include:**
- CVF version
- Node.js version
- OS (Windows/Mac/Linux)
- Full error message
- Steps to reproduce

**Template:**
```markdown
**CVF Version:** 1.6.0
**Node Version:** 18.12.0
**OS:** macOS 13.0

**Issue:**
[Describe the problem]

**Steps to Reproduce:**
1. Run `npm run dev`
2. Click on template
3. See error

**Error Message:**
```
[Paste full error]
```

**Screenshots:**
[If helpful]
```

[File issue here](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues/new?template=bug_report.md)

---

## 📚 More Resources

- [Getting Started](../docs/GET_STARTED.md)
- [Version Picker](version-picker.md)
- [Quick Reference](cheatsheets/quick-reference.md)
- [FAQ](faq.md)

---

<div align="center">

**Vẫn stuck?** [💬 Hỏi trên Discord](https://discord.gg/cvf)

[⬅️ Back to Docs](../docs/GET_STARTED.md)

</div>
