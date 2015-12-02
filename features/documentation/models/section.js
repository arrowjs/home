'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define("section", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            validate: {
                isInt: {
                    msg: 'please input integer value ID'
                }
            }
        },
        version_id: {
            type: DataTypes.INTEGER,
            validate: {
                isInt: {
                    msg: 'please input integer value ID'
                }
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: {
                    args: [1, 255],
                    msg: 'please input not too long title'
                },
                isEven: function (value) {
                    if (typeof value !== 'string' || value.match(/[+-,$%^*();\/|<>"'\\]/g)) {
                        throw new Error('Please input valid value title');
                    }
                }
            }
        },
        alias: {
            type: DataTypes.STRING(255),
            unique: true,
            validate: {
                len: {
                    args: [0, 255],
                    msg: 'please input not too long alias'
                },
                isValid: function (value) {
                    if (typeof value !== 'string') {
                        throw new Error('Please input valid value');
                    } else if (value === '') {
                        this.alias = this.title.replace(/[ ]/g, '-').toLowerCase();
                    }
                }
            }
        },
        ordering: {
            type: DataTypes.INTEGER,
            validate: {
                isInt: {
                    msg: 'please input integer value ID'
                }
            }
        }
    },{
        tableName: 'section',
        createdAt: false,
        updatedAt: false
    });
};