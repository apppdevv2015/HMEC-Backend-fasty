const componentService = require("../services/component.service");
const responseHandler = require("../../../utils/responseHandler");
const { HTTP_STATUS } = responseHandler;
const {
  getCompanyScope,
  getTenantFilter,
  isSuperAdmin,
} = require("../../../middlewares/auth.middleware");

class ComponentController {
  async addComponent(req, res) {
    try {
      req.body.companyId = isSuperAdmin(req)
        ? req.body.companyId || getCompanyScope(req)
        : req.user?.companyId;
      if (!req.body.companyId) throw new Error("Company context missing.");
      const component = await componentService.addComponent(req.body);
      return responseHandler(
        res,
        HTTP_STATUS.CREATED,
        true,
        "Component registered successfully",
        component,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async updateComponent(req, res) {
    try {
      const component = await componentService.updateComponent(
        req.params.id,
        req.body,
        getTenantFilter(req),
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Component updated successfully",
        component,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getComponentRegister(req, res) {
    try {
      const companyId = getCompanyScope(req);
      const register = await componentService.getComponentRegister(companyId);
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Component register fetched successfully",
        register,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getDashboardStats(req, res) {
    try {
      const companyId = getCompanyScope(req);
      if (!companyId) throw new Error("companyId is required");
      const stats = await componentService.getDashboardStats(companyId);
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Dashboard stats fetched successfully",
        stats,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getFinancialSummary(req, res) {
    try {
      const companyId = getCompanyScope(req);
      if (!companyId) throw new Error("companyId is required");
      const summary = await componentService.getFinancialSummary(companyId);
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Financial summary fetched successfully",
        summary,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async inspectComponent(req, res) {
    try {
      const userCompanyId = req.user.companyId;
      const userRole = req.user.role;
      const componentId = req.params.id;

      const component = await componentService.inspectComponent(
        componentId,
        req.body,
        userCompanyId,
        userRole,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Component inspected successfully",
        component,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async deleteComponent(req, res) {
    try {
      const component = await componentService.deleteComponent(
        req.params.id,
        getTenantFilter(req),
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Component deleted successfully",
        component,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getComponents(req, res) {
    try {
      const companyId = getCompanyScope(req);
      const components = await componentService.getComponents(
        req.query,
        companyId,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Components fetched successfully",
        components,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getComponentsByMachineId(req, res) {
    try {
      const machineId = req.params.machineId || req.params.id;
      const components = await componentService.getComponents(
        { machineId },
        getTenantFilter(req),
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Machine components fetched successfully",
        components,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getEngineerDashboardComponents(req, res) {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return responseHandler(
          res,
          HTTP_STATUS.BAD_REQUEST,
          false,
          "Company ID is required",
        );
      }

      const components =
        await componentService.getEngineerDashboardComponents(companyId);

      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Engineer dashboard components fetched successfully",
        components,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }
}

module.exports = new ComponentController();
