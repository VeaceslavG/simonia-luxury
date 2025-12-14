// dataProvider.js
import { fetchUtils } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";
import { API_URL } from "../config/api";

const httpClient = (url, options = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: "application/json" });
  }
  options.credentials = "include";

  const adminToken = localStorage.getItem("adminToken");
  if (adminToken) {
    options.headers.set("Authorization", `Bearer ${adminToken}`);
  } else {
    console.error("No admin token found for req");
  }

  return fetchUtils
    .fetchJson(url, options)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error("Req failed:", url, error.status, error.message);
      throw error;
    });
};

const baseDataProvider = simpleRestProvider(`${API_URL}/api/admin`, httpClient);

// ID -> id
const transformId = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) => ({
      ...item,
      id: item.ID || item.id,
    }));
  }
  return {
    ...data,
    id: data.ID || data.id,
  };
};

export const dataProvider = {
  ...baseDataProvider,

  getList: (resource, params) => {
    return baseDataProvider.getList(resource, params).then((response) => ({
      ...response,
      data: transformId(response.data),
    }));
  },

  getOne: (resource, params) => {
    return baseDataProvider.getOne(resource, params).then((response) => ({
      ...response,
      data: transformId(response.data),
    }));
  },

  getMany: (resource, params) => {
    return baseDataProvider.getMany(resource, params).then((response) => ({
      ...response,
      data: transformId(response.data),
    }));
  },

  getManyReference: (resource, params) => {
    return baseDataProvider
      .getManyReference(resource, params)
      .then((response) => ({
        ...response,
        data: transformId(response.data),
      }));
  },

  update: (resource, params) => {
    return baseDataProvider.update(resource, params).then((response) => ({
      ...response,
      data: transformId(response.data),
    }));
  },

  create: (resource, params) => {
    return baseDataProvider.create(resource, params).then((response) => ({
      ...response,
      data: transformId(response.data),
    }));
  },

  delete: (resource, params) => {
    return fetch(`${API_URL}/api/admin/${resource}/${params.id}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    })
      .then((response) => {
        if (response.status === 204) {
          return { data: { id: params.id } };
        } else {
          throw new Error(`HTTP Error: ${response.status}`);
        }
      })
      .catch((error) => {
        console.error("Delete failed:", resource, params.id, error);
        throw error;
      });
  },
};

export default dataProvider;
