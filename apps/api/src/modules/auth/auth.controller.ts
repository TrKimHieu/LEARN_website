import { Controller, Get, Patch, Post, Body, HttpCode, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { HttpStatus } from '@nestjs/common';
import { zodBody, ApiError } from '../../common/errors';
import {
  Auth,
  CurrentUser,
  RateLimitGuard,
  Throttle,
  type UserContext,
} from '../../common/security';
import {
  registerSchema,
  loginSchema,
  patchMeSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type RegisterInput,
  type LoginInput,
  type PatchMeInput,
  type ChangePasswordInput,
} from '@learn/contracts';
import { AuthService } from './auth.service';
import { env } from '../../environment';

const REFRESH_COOKIE = 'refresh_token';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @UseGuards(RateLimitGuard)
  @Throttle(10, 60)
  async register(
    @Body(zodBody(registerSchema)) body: RegisterInput,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.auth.register(body, req.ip);
    attachRefreshCookie(res, result.refreshToken);
    return res
      .status(HttpStatus.CREATED)
      .json({ user: result.user, accessToken: result.accessToken });
  }

  @Post('login')
  @UseGuards(RateLimitGuard)
  @Throttle(5, 60)
  async login(
    @Body(zodBody(loginSchema)) body: LoginInput,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const result = await this.auth.login(body, req.headers['user-agent'] ?? undefined, req.ip);
    attachRefreshCookie(res, result.refreshToken);
    return res.json({ user: result.user, accessToken: result.accessToken });
  }

  /** FR-AUTH-07. Công khai (NFR-SEC-11). Cùng một câu trả lời cho mọi email. */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @Throttle(5, 900)
  async forgotPassword(
    @Body(zodBody(forgotPasswordSchema)) body: ForgotPasswordInput,
    @Req() req: Request,
  ) {
    await this.auth.requestPasswordReset(body.email, req.ip);
    return { ok: true };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @Throttle(10, 900)
  async resetPassword(
    @Body(zodBody(resetPasswordSchema)) body: ResetPasswordInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.resetPassword(body.token, body.newPassword, req.ip);
    // Mọi phiên đã bị thu hồi ở server; xoá luôn cookie của trình duyệt đang dùng.
    res.clearCookie(REFRESH_COOKIE, cookieOptions());
    return { ok: true };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const token = (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? '';
    if (!token) throw ApiError.unauthenticated();
    const result = await this.auth.refresh(token, req.headers['user-agent'] ?? undefined, req.ip);
    attachRefreshCookie(res, result.refreshToken);
    return res.json({ user: result.user, accessToken: result.accessToken });
  }

  @Post('logout')
  @Auth()
  async logout(@Req() req: Request, @Res() res: Response) {
    const token = (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? '';
    if (token) await this.auth.revokeToken(token);
    res.clearCookie(REFRESH_COOKIE, cookieOptions());
    return res.json({ ok: true });
  }

  @Post('logout-all')
  @Auth()
  async logoutAll(@CurrentUser() user: UserContext, @Res() res: Response) {
    await this.auth.revokeAllForUser(user.userId);
    res.clearCookie(REFRESH_COOKIE, cookieOptions());
    return res.json({ ok: true });
  }

  @Get('me')
  @Auth()
  async me(@CurrentUser() user: UserContext) {
    return this.auth.me(user.userId);
  }

  @Patch('me')
  @Auth()
  async patchMe(
    @CurrentUser() user: UserContext,
    @Body(zodBody(patchMeSchema)) body: PatchMeInput,
  ) {
    return this.auth.patchMe(user.userId, body);
  }

  @Post('change-password')
  @Auth()
  async changePassword(
    @CurrentUser() user: UserContext,
    @Body(zodBody(changePasswordSchema)) body: ChangePasswordInput,
  ) {
    await this.auth.changePassword(user.userId, body.currentPassword, body.newPassword);
    return { ok: true };
  }
}

function cookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86400 * 1000,
  };
}

function attachRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, cookieOptions());
}
