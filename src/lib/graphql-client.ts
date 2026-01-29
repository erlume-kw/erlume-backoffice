import { GraphQLClient, gql } from 'graphql-request';
import { GRAPHQL_ENDPOINT } from './api-config';
import type { DashboardKpis, User, Item, Order, Seller, Category, Drop, DiscountCode, Review, Outfit, Demand, Transaction } from '@/types/models';

const client = new GraphQLClient(GRAPHQL_ENDPOINT);

// Dashboard KPIs Query
export const DASHBOARD_KPIS_QUERY = gql`
  query DashboardKpis {
    dashboardKpis {
      totalRevenue
      revenueChange
      totalOrders
      ordersChange
      totalUsers
      usersChange
      totalItems
      itemsChange
      averageOrderValue
      conversionRate
      topCategories {
        name
        count
        revenue
      }
      revenueByDay {
        date
        revenue
        orders
      }
      ordersByStatus {
        status
        count
      }
    }
  }
`;

// Users Query
export const USERS_TABLE_QUERY = gql`
  query UsersTable($limit: Int, $skip: Int, $includeDeleted: Boolean) {
    usersTable(limit: $limit, skip: $skip, includeDeleted: $includeDeleted) {
      _id
      email
      firstName
      lastName
      phone
      avatar
      role
      status
      createdAt
      updatedAt
      deletedAt
    }
  }
`;

// Items Query
export const ITEMS_TABLE_QUERY = gql`
  query ItemsTable($limit: Int, $skip: Int, $itemStatus: String, $categoryId: String, $sellerId: String, $dropId: String) {
    itemsTable(limit: $limit, skip: $skip, itemStatus: $itemStatus, categoryId: $categoryId, sellerId: $sellerId, dropId: $dropId) {
      _id
      title
      description
      brand
      size
      color
      condition
      originalPrice
      price
      images
      status
      views
      likes
      sellerId
      categoryId
      dropId
      createdAt
      updatedAt
    }
  }
`;

// Orders Query
export const ORDERS_TABLE_QUERY = gql`
  query OrdersTable($limit: Int, $skip: Int) {
    ordersTable(limit: $limit, skip: $skip) {
      _id
      orderNumber
      status
      subtotal
      discount
      shipping
      tax
      total
      userId
      createdAt
      updatedAt
    }
  }
`;

// Generic findAll Query
export const FIND_ALL_QUERY = gql`
  query FindAll($model: String!, $limit: Int, $skip: Int) {
    findAll(model: $model, limit: $limit, skip: $skip)
  }
`;

// FindById Query
export const FIND_BY_ID_QUERY = gql`
  query FindById($model: String!, $id: String!) {
    findById(model: $model, id: $id)
  }
`;

// GraphQL API functions
export const graphqlApi = {
  getDashboardKpis: async (): Promise<DashboardKpis> => {
    const response = await client.request<{ dashboardKpis: DashboardKpis }>(DASHBOARD_KPIS_QUERY);
    return response.dashboardKpis;
  },

  getUsersTable: async (limit = 20, skip = 0, includeDeleted = false): Promise<User[]> => {
    const response = await client.request<{ usersTable: User[] }>(USERS_TABLE_QUERY, { limit, skip, includeDeleted });
    return response.usersTable;
  },

  getItemsTable: async (params: { limit?: number; skip?: number; itemStatus?: string; categoryId?: string; sellerId?: string; dropId?: string }): Promise<Item[]> => {
    const response = await client.request<{ itemsTable: Item[] }>(ITEMS_TABLE_QUERY, params);
    return response.itemsTable;
  },

  getOrdersTable: async (limit = 20, skip = 0): Promise<Order[]> => {
    const response = await client.request<{ ordersTable: Order[] }>(ORDERS_TABLE_QUERY, { limit, skip });
    return response.ordersTable;
  },

  findAll: async <T>(model: string, limit = 20, skip = 0): Promise<T[]> => {
    const response = await client.request<{ findAll: T[] }>(FIND_ALL_QUERY, { model, limit, skip });
    return response.findAll;
  },

  findById: async <T>(model: string, id: string): Promise<T> => {
    const response = await client.request<{ findById: T }>(FIND_BY_ID_QUERY, { model, id });
    return response.findById;
  },
};

export default graphqlApi;
